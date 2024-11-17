// Подключаем необходимые библиотеки и модули
const request = require("supertest");
const {
  app,
  calculateAge,
  approveLoan,
  calculateMonthlyPayment,
} = require("../server");

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
  })),
}));

jest.mock("node-telegram-bot-api", () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue(true),
  }));
});

const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
jest.mock("../server", () => {
  const originalModule = jest.requireActual("../server");
  return {
    ...originalModule,
    notifyTelegramUser: jest.fn(),
  };
});

// Тесты для функции calculateAge
describe("Функция calculateAge", () => {
  test("возвращает правильный возраст для даты рождения", () => {
    const birthDate = "2000-01-01";
    const age = calculateAge(birthDate);
    console.log(`Введенная дата рождения: ${birthDate}`);
    console.log(`Вычисленный возраст: ${age}`);
    expect(age).toBe(new Date().getFullYear() - 2000);
  });

  test("возвращает корректный возраст для текущего месяца и дня", () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    const age = calculateAge(birthDate.toISOString().split("T")[0]);
    console.log(
      `Введенная дата рождения: ${birthDate.toISOString().split("T")[0]}`
    );
    console.log(`Вычисленный возраст: ${age}`);
    expect(age).toBe(18);
  });
});

// Тесты для функции approveLoan
describe("Функция approveLoan", () => {
  test("отклоняет заявку, если зарплата ниже минимальной", (done) => {
    const applicationData = {
      salary: 25000,
      loanAmount: 100000,
      birthDate: "1995-01-01",
      maritalStatus: "single",
      employmentType: "full-time",
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Отклонена");
        expect(reason).toBe(
          "Ваш доход ниже минимального для получения кредита."
        );
        done();
      },
      true
    );
  });

  test("одобряет кредит, если все параметры соответствуют требованиям", (done) => {
    const applicationData = {
      salary: 40000,
      loanAmount: 100000,
      birthDate: "1995-01-01",
      maritalStatus: "single",
      employmentType: "full-time",
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Одобрена");
        expect(reason).toBe("");
        done();
      },
      true
    );
  });

  test("отклоняет заявку, если возраст заявителя ниже минимального", (done) => {
    const applicationData = {
      salary: 50000,
      loanAmount: 100000,
      birthDate: new Date(new Date().getFullYear() - 17, 0, 1)
        .toISOString()
        .split("T")[0], // Возраст меньше 18 лет
      maritalStatus: "single",
      employmentType: "full-time",
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Отклонена");
        expect(reason).toBe("Заявителю должно быть не менее 18 лет.");
        done();
      },
      true
    );
  });

  test("отклоняет заявку, если сумма кредита слишком велика по сравнению с доходом", (done) => {
    const applicationData = {
      salary: 30000,
      loanAmount: 1000000,
      birthDate: "1995-01-01",
      maritalStatus: "single",
      employmentType: "full-time",
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Отклонена");
        expect(reason).toBe(
          "Запрашиваемая сумма кредита превышает допустимый лимит относительно вашего дохода."
        );
        done();
      },
      true
    );
  });

  test("отклоняет заявку, если заявитель не подтверждает занятость", (done) => {
    const applicationData = {
      salary: 50000,
      loanAmount: 100000,
      birthDate: "1995-01-01",
      maritalStatus: "single",
      employmentType: "unemployed", // Безработный
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Отклонена");
        expect(reason).toBe(
          "Кредит не может быть предоставлен с текущим типом занятости."
        );
        done();
      },
      true
    );
  });

  test("одобряет заявку, если все параметры соответствуют требованиям", (done) => {
    const applicationData = {
      salary: 70000,
      loanAmount: 200000,
      birthDate: "1985-01-01",
      maritalStatus: "married",
      employmentType: "full-time",
    };
    approveLoan(
      applicationData,
      (status, reason) => {
        console.log("Введенные данные:", applicationData);
        console.log(`Результат: статус - ${status}, причина - ${reason}`);
        expect(status).toBe("Одобрена");
        expect(reason).toBe("");
        done();
      },
      true
    );
  });
});

// Тесты для эндпоинта /calculatePayment

describe("Функция calculateMonthlyPayment", () => {
  test("возвращает NaN, если параметры не заданы", () => {
    const result = calculateMonthlyPayment(undefined, undefined, undefined);
    console.log("Результат расчета:", result);
    expect(result).toBeNaN();
  });

  test("возвращает правильный расчет платежа", () => {
    const loanAmount = 500000;
    const loanTerm = 5; // лет
    const interestRate = 12; // процентов
    const result = calculateMonthlyPayment(loanAmount, loanTerm, interestRate);
    console.log("Результат расчета:", result);
    expect(result).toBeGreaterThan(0);
  });

  test("правильно рассчитывает ежемесячный платеж для стандартного кредита", () => {
    const loanAmount = 300000;
    const loanTerm = 10; // лет
    const interestRate = 10; // процентов
    const result = calculateMonthlyPayment(loanAmount, loanTerm, interestRate);
    console.log("Результат расчета:", result);
    expect(result).toBeCloseTo(3964.52, 2);
  });

  test("правильно рассчитывает ежемесячный платеж для короткого срока", () => {
    const loanAmount = 200000;
    const loanTerm = 1; // год
    const interestRate = 8; // процентов
    const result = calculateMonthlyPayment(loanAmount, loanTerm, interestRate);
    console.log("Результат расчета:", result);
    expect(result).toBeCloseTo(17397.69, 2);
  });

  test("правильно рассчитывает ежемесячный платеж для большого срока и низкой ставки", () => {
    const loanAmount = 500000;
    const loanTerm = 30; // лет
    const interestRate = 3; // процентов
    const result = calculateMonthlyPayment(loanAmount, loanTerm, interestRate);
    console.log("Результат расчета:", result);
    expect(result).toBeCloseTo(2108.02, 2);
  });
});

// Тесты для эндпоинта /submitApplication
describe("Эндпоинт /submitApplication", () => {
  // Данные для тестовой заявки
  const applicationData = {
    name: "Иван Иванов",
    phone: "89082533305",
    email: "ivan@example.com",
    address: "г. Москва, ул. Примерная, д. 1",
    birthDate: "1990-01-01",
    maritalStatus: "single",
    employmentType: "full-time",
    loanAmount: 100000,
    loanTerm: 5,
    interestRate: 12,
    salary: 50000,
    loanPurpose: "consumer",
    downPayment: 0,
    submittedAt: new Date().toISOString(),
  };

  beforeAll(() => {
    process.env.SUBMISSION_DELAY = 500; // Уменьшаем задержку до 0,5 секунды для ускорения тестов
  });

  afterAll(() => {
    consoleSpy.mockRestore(); // Восстанавливаем оригинальный console.log
    delete process.env.SUBMISSION_DELAY; // Удаляем временную переменную окружения
  });

  // Тест: проверка обработки заявки при корректных данных
  test("принимает и обрабатывает заявку при корректных данных", async () => {
    const response = await request(app)
      .post("/submitApplication")
      .send(applicationData); // Отправляем корректные данные заявки
    expect(response.statusCode).toBe(200); // Ожидаем статус 200
    expect(response.body.status).toBe("success"); // Проверяем, что статус "success"
  }, 15000); // Устанавливаем максимальное время для выполнения теста
});

// const request = require("supertest");
// const { app, calculateAge, approveLoan, pool, server } = require("../server");

// // Закрытие соединений после тестов
// afterAll(async () => {
//   if (pool && typeof pool.end === "function") {
//     await pool.end(); // Закрываем соединение с базой данных
//   }
//   if (server && typeof server.close === "function") {
//     server.close(); // Закрываем сервер
//   }
// });

// // Тесты для функции calculateAge
// describe("Функция calculateAge", () => {
//   test("возвращает правильный возраст для даты рождения", () => {
//     const birthDate = "2000-01-01";
//     const age = calculateAge(birthDate);
//     console.log(`Введенная дата рождения: ${birthDate}`);
//     console.log(`Вычисленный возраст: ${age}`);
//     expect(age).toBe(new Date().getFullYear() - 2000);
//   });

//   test("возвращает корректный возраст для текущего месяца и дня", () => {
//     const today = new Date();
//     const birthDate = new Date(
//       today.getFullYear() - 18,
//       today.getMonth(),
//       today.getDate()
//     );
//     const age = calculateAge(birthDate.toISOString().split("T")[0]);
//     console.log(
//       `Введенная дата рождения: ${birthDate.toISOString().split("T")[0]}`
//     );
//     console.log(`Вычисленный возраст: ${age}`);
//     expect(age).toBe(18);
//   });
// });

// // Тесты для функции approveLoan
// describe("Функция approveLoan", () => {
//   test("отклоняет заявку, если зарплата ниже минимальной", (done) => {
//     const applicationData = {
//       salary: 25000,
//       loanAmount: 100000,
//       birthDate: "1995-01-01",
//       maritalStatus: "single",
//       employmentType: "full-time",
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Отклонена");
//         expect(reason).toBe(
//           "Ваш доход ниже минимального для получения кредита."
//         );
//         done();
//       },
//       true
//     );
//   });

//   test("одобряет кредит, если все параметры соответствуют требованиям", (done) => {
//     const applicationData = {
//       salary: 40000,
//       loanAmount: 100000,
//       birthDate: "1995-01-01",
//       maritalStatus: "single",
//       employmentType: "full-time",
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Одобрена");
//         expect(reason).toBe("");
//         done();
//       },
//       true
//     );
//   });

//   test("отклоняет заявку, если возраст заявителя ниже минимального", (done) => {
//     const applicationData = {
//       salary: 50000,
//       loanAmount: 100000,
//       birthDate: new Date(new Date().getFullYear() - 17, 0, 1)
//         .toISOString()
//         .split("T")[0], // Возраст меньше 18 лет
//       maritalStatus: "single",
//       employmentType: "full-time",
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Отклонена");
//         expect(reason).toBe("Заявителю должно быть не менее 18 лет.");
//         done();
//       },
//       true
//     );
//   });

//   test("отклоняет заявку, если сумма кредита слишком велика по сравнению с доходом", (done) => {
//     const applicationData = {
//       salary: 30000,
//       loanAmount: 1000000,
//       birthDate: "1995-01-01",
//       maritalStatus: "single",
//       employmentType: "full-time",
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Отклонена");
//         expect(reason).toBe(
//           "Запрашиваемая сумма кредита превышает допустимый лимит относительно вашего дохода."
//         );
//         done();
//       },
//       true
//     );
//   });

//   test("отклоняет заявку, если заявитель не подтверждает занятость", (done) => {
//     const applicationData = {
//       salary: 50000,
//       loanAmount: 100000,
//       birthDate: "1995-01-01",
//       maritalStatus: "single",
//       employmentType: "unemployed", // Безработный
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Отклонена");
//         expect(reason).toBe(
//           "Кредит не может быть предоставлен с текущим типом занятости."
//         );
//         done();
//       },
//       true
//     );
//   });

//   test("одобряет заявку, если все параметры соответствуют требованиям", (done) => {
//     const applicationData = {
//       salary: 70000,
//       loanAmount: 200000,
//       birthDate: "1985-01-01",
//       maritalStatus: "married",
//       employmentType: "full-time",
//     };
//     approveLoan(
//       applicationData,
//       (status, reason) => {
//         console.log("Введенные данные:", applicationData);
//         console.log(`Результат: статус - ${status}, причина - ${reason}`);
//         expect(status).toBe("Одобрена");
//         expect(reason).toBe("");
//         done();
//       },
//       true
//     );
//   });
// });

// // Тесты для эндпоинта /calculatePayment
// describe("Эндпоинт /calculatePayment", () => {
//   test("возвращает ошибку, если параметры не заданы", async () => {
//     const response = await request(app).post("/calculatePayment").send({});
//     console.log("Отправленный запрос: {}", {});
//     console.log("Ответ сервера:", response.body);
//     expect(response.statusCode).toBe(400);
//     expect(response.body.error).toBe(
//       "Необходимо указать сумму кредита, срок и процентную ставку."
//     );
//   });

//   test("возвращает правильный расчет платежа", async () => {
//     const requestData = { loanAmount: 500000, loanTerm: 5, interestRate: 12 };
//     const response = await request(app)
//       .post("/calculatePayment")
//       .send(requestData);
//     console.log("Отправленный запрос:", requestData);
//     console.log("Ответ сервера:", response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.monthlyPayment).toBeGreaterThan(0);
//   });

//   test("правильно рассчитывает ежемесячный платеж для стандартного кредита", async () => {
//     const requestData = { loanAmount: 300000, loanTerm: 10, interestRate: 10 };
//     const response = await request(app)
//       .post("/calculatePayment")
//       .send(requestData);
//     console.log("Отправленный запрос:", requestData);
//     console.log("Ответ сервера:", response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.monthlyPayment).toBeCloseTo(3964.52, 2);
//   });

//   test("правильно рассчитывает ежемесячный платеж для короткого срока", async () => {
//     const requestData = { loanAmount: 200000, loanTerm: 1, interestRate: 8 };
//     const response = await request(app)
//       .post("/calculatePayment")
//       .send(requestData);
//     console.log("Отправленный запрос:", requestData);
//     console.log("Ответ сервера:", response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.monthlyPayment).toBeCloseTo(17397.69, 2);
//   });

//   test("правильно рассчитывает ежемесячный платеж для большого срока и низкой ставки", async () => {
//     const requestData = { loanAmount: 500000, loanTerm: 30, interestRate: 3 };
//     const response = await request(app)
//       .post("/calculatePayment")
//       .send(requestData);
//     console.log("Отправленный запрос:", requestData);
//     console.log("Ответ сервера:", response.body);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.monthlyPayment).toBeCloseTo(2108.02, 2);
//   });
// });
