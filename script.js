// Функция для обновления отображаемого значения суммы кредита
function updateLoanAmount() {
  const loanAmount = document.getElementById("loanAmount").value;
  document.getElementById("loanAmountValue").innerText = `${loanAmount} ₽`;
}
function updateLoanTerm() {
  const loanTerm = document.getElementById("loanTerm").value;
  document.getElementById("loanTermValue").textContent = loanTerm + " лет";
}

// Отображение блока с полем первоначального взноса
function toggleDownPayment(elementId, containerId) {
  const downPaymentContainer = document.getElementById(containerId);
  const loanPurpose = document.getElementById(elementId).value;
  if (loanPurpose === "mortgage") {
    downPaymentContainer.style.display = "block"; // Показываем поле
  } else {
    downPaymentContainer.style.display = "none"; // Скрываем поле
  }
}

// Функция для расчета ежемесячного платежа
function calculatePayment() {
  const loanAmount = parseFloat(document.getElementById("loanAmount").value);
  const loanTerm = parseFloat(document.getElementById("loanTerm").value);

  const loanPurpose = document.getElementById("loanPurpose").value;
  const interestRate = parseFloat(
    document.getElementById("interestRate").value
  );
  const downPaymentInput = document.getElementById("downPayment"); // Ссылка на поле первоначального взноса
  const downPayment =
    parseFloat(document.getElementById("downPayment").value) || 0; // Первоначальный взнос

  // Проверка: первоначальный взнос не должен превышать сумму кредита
  if (downPayment > loanAmount) {
    // Показать попап с сообщением об ошибке
    showErrorPopup("Первоначальный взнос не может быть больше суммы кредита.");
    downPaymentInput.focus();
    return; // Остановить выполнение функции, если условие выполнено
  }

  // Подготовка данных для отправки на сервер
  const calculationData = {
    loanAmount: loanAmount,
    loanTerm: loanTerm,
    loanPurpose: loanPurpose,
    interestRate: interestRate,
    downPayment: downPayment,
  };

  let formBody = [];
  for (const property in calculationData) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(calculationData[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  // Отправка запроса на сервер для расчета ежемесячного платежа
  DOMAIN = "http://localhost:8080";

  fetch(DOMAIN + "/api/calculator", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded", // Спросить контент тайп
    },
    body: formBody,
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log(data); // Выводим ответ сервера в консоль
      const monthly_payment = data.monthly_payment;
      if (monthly_payment === undefined) {
        throw new Error("Ответ сервера не содержит поля monthlyPayment.");
      }
      document.getElementById(
        "monthlyPayment"
      ).innerText = `${monthly_payment.toFixed(2)} ₽`;
    })

    .catch((error) => {
      showErrorPopup("Ошибка при расчете ежемесячного платежа.");
      console.error("Error calculating monthly payment:", error);
    });

  console.log(calculationData);
}

// Функция для переключения между формой калькулятора и формой заявки с анимацией
function toggleForm() {
  const container = document.querySelector(".container");
  const toggleButton = document.getElementById("toggleButton");
  const formTitle = document.getElementById("formTitle");
  const resultBlock = document.querySelector(".result");
  const calculatorForm = document.getElementById("calculatorForm");
  const applicationForm = document.getElementById("applicationForm");

  // Получаем поля из калькулятора
  const loanAmount = document.getElementById("loanAmount").value;
  const loanTerm = document.getElementById("loanTerm").value;
  const interestRate = document.getElementById("interestRate").value;

  // Получаем поля формы заявки
  const appLoanAmount = document.getElementById("appLoanAmount");
  const appLoanTerm = document.getElementById("appLoanTerm");
  const appInterestRate = document.getElementById("appInterestRate");

  // Перенос суммы кредита
  appLoanAmount.value = loanAmount;
  document.getElementById("appLoanAmountValue").textContent = loanAmount + " ₽";

  // Перенос срока кредита
  appLoanTerm.value = loanTerm;
  document.getElementById("appLoanTermValue").textContent = loanTerm + " лет";

  // Перенос процентной ставки
  appInterestRate.value = interestRate;

  if (container.classList.contains("normal")) {
    container.classList.remove("normal");
    container.classList.add("reversed");

    // Меняем заголовок и кнопку
    formTitle.textContent = "Заявка на одобрение кредита";
    toggleButton.textContent = "Кредитный калькулятор";
    toggleButton.classList.add("left-arrow");

    // Скрываем блок с результатом
    resultBlock.classList.add("hidden");

    // Плавная смена местами блоков
    calculatorForm.style.opacity = "0";
    applicationForm.style.opacity = "1";
    setTimeout(() => {
      calculatorForm.style.display = "none";
      applicationForm.style.display = "block";
      applicationForm.style.overflow = "auto";
    }, 500);
  } else {
    container.classList.remove("reversed");
    container.classList.add("normal");

    // Меняем заголовок и кнопку обратно
    formTitle.textContent = "Кредитный калькулятор";
    toggleButton.textContent = "Оставить заявку";
    toggleButton.classList.remove("left-arrow");

    // Показываем блок с результатом
    resultBlock.classList.remove("hidden");

    // Плавная смена местами блоков
    applicationForm.style.opacity = "0";
    calculatorForm.style.opacity = "1";
    setTimeout(() => {
      applicationForm.style.display = "none";
      calculatorForm.style.display = "block";
      calculatorForm.style.overflow = "auto";
    }, 500);
  }
}

// Функции для обновления ползунков в форме заявки
function updateApplicationLoanAmount() {
  const loanAmount = document.getElementById("appLoanAmount").value;
  document.getElementById("appLoanAmountValue").textContent = loanAmount + " ₽";
}

function updateApplicationLoanTerm() {
  const loanTerm = document.getElementById("appLoanTerm").value;
  document.getElementById("appLoanTermValue").textContent = loanTerm + " лет";
}

// Функция для отправки заявки на сервер
// Функция для проверки поля на валидность
function validateField(field, regex, errorMessage, example) {
  const value = field.value.trim();
  if (!regex.test(value)) {
    showValidationPopup(`${errorMessage}\nПример: ${example}`);
    field.focus();
    return false;
  }
  return true;
}

// Функция для отправки заявки на сервер с валидацией
function submitApplication() {
  const name = document.getElementById("applicantFullName");
  const phone = document.getElementById("applicantPhone");
  const email = document.getElementById("applicantEmail");
  const address = document.getElementById("applicantAddress");
  const birthDate = document.getElementById("applicantBirthDate");
  const maritalStatus = document.getElementById("maritalStatus");
  const employmentType = document.getElementById("employmentType");
  const loanAmount = document.getElementById("appLoanAmount");
  const loanTerm = document.getElementById("appLoanTerm");
  const interestRate = document.getElementById("appInterestRate");
  const salary = document.getElementById("salary");
  const loanPurpose = document.getElementById("appLoanPurpose");
  const downPayment = document.getElementById("applicationDownPayment");

  // Проверка полей на валидность
  if (
    !validateField(
      name,
      /^[a-zA-Zа-яА-Я\s]+$/,
      "Введите корректное имя",
      "Иван Иванов"
    )
  )
    return;
  if (
    !validateField(
      phone,
      /^(8)\d{10}$/,
      "Введите корректный номер телефона",
      "89082533305"
    )
  )
    return;
  if (
    !validateField(
      email,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Введите корректный email",
      "example@mail.com"
    )
  )
    return;
  if (
    !validateField(
      address,
      /^.{10,}$/,
      "Адрес должен содержать минимум 10 символов",
      "г. Москва, ул. Примерная, д. 1"
    )
  )
    return;
  if (
    !validateField(
      salary,
      /^\d{1,7}$/,
      "Введите корректную сумму дохода (не более 7 цифр)",
      "50000"
    )
  )
    return;

  // Проверка пустоты полей выпадающего списка и слайдеров
  if (!maritalStatus.value) {
    showValidationPopup("Пожалуйста, выберите семейное положение.");
    maritalStatus.focus();
    return;
  }

  if (!employmentType.value) {
    showValidationPopup("Пожалуйста, выберите тип занятости.");
    employmentType.focus();
    return;
  }

  if (!loanAmount.value) {
    showValidationPopup("Пожалуйста, выберите сумму кредита.");
    loanAmount.focus();
    return;
  }

  if (!loanTerm.value) {
    showValidationPopup("Пожалуйста, выберите срок кредита.");
    loanTerm.focus();
    return;
  }

  if (!interestRate.value) {
    showValidationPopup("Пожалуйста, выберите процентную ставку.");
    interestRate.focus();
    return;
  }

  if (!loanPurpose.value) {
    showValidationPopup("Пожалуйста, выберите цель кредита.");
    loanPurpose.focus();
    return;
  }

  // Проверка возраста
  const today = new Date();
  const birth = new Date(birthDate.value);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18 || age > 100) {
    showValidationPopup(
      "Заявителю должно быть не менее 18 лет и не более 100 лет"
    );
    return;
  }

  // Проверка на первоначальный взнос, если он больше суммы кредита
  if (downPayment && parseInt(downPayment.value) > parseInt(loanAmount.value)) {
    showValidationPopup(
      "Первоначальный взнос не может превышать сумму кредита."
    );
    downPayment.focus();
    return;
  }

  // Формирование данных для отправки
  const applicationData = {
    name: name.value,
    phone: phone.value,
    email: email.value,
    address: address.value,
    birthDate: birthDate.value,
    maritalStatus: maritalStatus.value,
    employmentType: employmentType.value,
    loanAmount: loanAmount.value,
    loanTerm: loanTerm.value,
    interestRate: interestRate.value,
    salary: salary.value,
    loanPurpose: loanPurpose.value,
    downPayment: downPayment.value,
    submittedAt: new Date().toISOString(),
  };

  let formBody = [];
  for (const property in applicationData) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(applicationData[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  // Показываем сообщение пользователю, что заявка обрабатывается
  showSuccessPopup("Заявка обрабатывается. Пожалуйста, подождите...", true);

  DOMAIN = "http://localhost:8080";

  // Отправка данных на сервер
  fetch(DOMAIN + "/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("status is: ", data.status);
      console.log("Полученные данные с сервера:", data); // Логируем данные с сервера
      if (data.status === "Rejected" || data.status === "Approved") {
        showInfoPopup(data.reason);
      } else if (data.status === "error") {
        showInfoPopup(data.reason);
      }
    })
    .catch((error) => {
      showErrorPopup(error.reason);
    });
  // Очистка формы заявки после отправки
  document.getElementById("application-form").reset();
}

// Функции для обновления ползунков в форме заявки
function updateApplicationLoanAmount() {
  const loanAmount = document.getElementById("appLoanAmount").value;
  document.getElementById("appLoanAmountValue").textContent = loanAmount + " ₽";
}

function updateApplicationLoanTerm() {
  const loanTerm = document.getElementById("appLoanTerm").value;
  document.getElementById("appLoanTermValue").textContent = loanTerm + " лет";
}

// Процентные ставки для разных назначений кредита
const interestRates = {
  mortgage: [4, 5, 6],
  car_loan: [6, 8, 10],
  consumer_loan: [10, 12, 14],
};

// Обновление процентных ставок в зависимости от назначения кредита
function updateInterestRateOptions(formType) {
  let loanPurpose, interestRateSelect;

  if (formType === "credit") {
    loanPurpose = document.getElementById("loanPurpose").value;
    interestRateSelect = document.getElementById("interestRate");
  } else {
    loanPurpose = document.getElementById("appLoanPurpose").value;
    interestRateSelect = document.getElementById("appInterestRate");
  }

  // Очистка текущих опций
  interestRateSelect.innerHTML = "";

  // Добавление новых опций в зависимости от назначения кредита
  interestRates[loanPurpose].forEach((rate) => {
    const option = document.createElement("option");
    option.value = rate;
    option.textContent = `${rate}%`;
    interestRateSelect.appendChild(option);
  });
}

//fesdfsdfdsf
// Прогресс-бар для формы заявки
function updateProgressBar() {
  const formFields = document.querySelectorAll(
    "#application-form input, #application-form select"
  );
  let filledFields = 0;

  formFields.forEach((field) => {
    if (
      field.type === "range" ||
      field.type === "select-one" ||
      field.value.trim() !== ""
    ) {
      filledFields++;
    }
  });

  const totalFields = formFields.length;
  const progressPercent = (filledFields / totalFields) * 100;

  // Обновляем ширину прогресс-бара
  document.getElementById("progressBar").style.width = `${progressPercent}%`;

  // Обновляем отображение процента рядом с прогресс-баром
  document.getElementById("progressPercent").textContent = `${Math.round(
    progressPercent
  )}%`;
}

// Подгрузка HTML с попапами
let popupsLoaded = false; // флаг для отслеживания загрузки попапов

// Подгрузка HTML с попапами
function loadPopups() {
  fetch("popup.html")
    .then((response) => {
      if (!response.ok) throw new Error("Ошибка загрузки попапов");
      return response.text();
    })
    .then((data) => {
      document.getElementById("popupsContainer").innerHTML = data;
      popupsLoaded = true; // установка флага после завершения загрузки
    })
    .catch((error) => {
      console.error("Не удалось загрузить попапы:", error);
    });
}

// Общая функция для инициализации всех компонентов при загрузке страницы
function initializePage() {
  // Загрузка попапов
  loadPopups();

  // Инициализация процентной ставки для калькулятора и формы заявки
  updateInterestRateOptions("credit");
  updateInterestRateOptions("application");

  // Обновление прогресс-бара сразу после загрузки страницы
  updateProgressBar();

  // Добавление событий на ввод в полях формы заявки для обновления прогресс-бара
  document
    .querySelectorAll("#application-form input, #application-form select")
    .forEach((element) => {
      element.addEventListener("input", updateProgressBar);
    });

  // Добавление события для кнопки расчета платежа
  document
    .getElementById("calculateButton")
    .addEventListener("click", calculatePayment);
}

// Установка общей функции инициализации для события загрузки страницы
window.onload = initializePage;

// fetch("http://localhost:3000/calculatePayment", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify(calculationData),
// })
//   .then((response) => response.json())
//   .then((data) => {
//     const monthlyPayment = data.monthlyPayment;

//     // Обновляем отображение результата
//     document.getElementById(
//       "monthlyPayment"
//     ).innerText = `${monthlyPayment.toFixed(2)} ₽`;
//   })
//   .catch((error) => {
//     showErrorPopup("Ошибка при расчете ежемесячного платежа.");
//     console.error("Error calculating monthly payment:", error);
//   });
