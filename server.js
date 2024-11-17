// app.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const TelegramBot = require("node-telegram-bot-api");

// Конфигурация базы данных и токен Telegram из .env
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const pool = new Pool(dbConfig);
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Словарь для хранения времени последней отправки заявки по идентификатору пользователя (например, по email или телефону)
const lastSubmissionTime = new Map();

// Функция для расчета возраста
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Логика одобрения кредита
const approveLoan = (applicationData, callback, skipTimeout = false) => {
  const MIN_SALARY_FOR_APPROVAL = 30000;
  const MAX_LOAN_AMOUNT_TO_SALARY_RATIO = 5;
  const RESTRICTED_EMPLOYMENT_TYPES = ["unemployed"];
  const minAge = 18;

  const { salary, loanAmount, birthDate, maritalStatus, employmentType } =
    applicationData;
  const age = calculateAge(birthDate);

  const processApplication = () => {
    let applicationStatus = "Отклонена";
    let rejectionReason = "";

    if (parseInt(salary, 10) < MIN_SALARY_FOR_APPROVAL) {
      rejectionReason = "Ваш доход ниже минимального для получения кредита.";
    } else if (RESTRICTED_EMPLOYMENT_TYPES.includes(employmentType)) {
      rejectionReason =
        "Кредит не может быть предоставлен с текущим типом занятости.";
    } else if (
      parseInt(loanAmount, 10) >
      MAX_LOAN_AMOUNT_TO_SALARY_RATIO * parseInt(salary, 10)
    ) {
      rejectionReason =
        "Запрашиваемая сумма кредита превышает допустимый лимит относительно вашего дохода.";
    } else if (maritalStatus === "divorced" || maritalStatus === "widowed") {
      rejectionReason = "Мы можем предложить вам ограниченные условия кредита.";
      applicationStatus = "Ограниченные условия";
    } else if (age < minAge) {
      rejectionReason = "Заявителю должно быть не менее 18 лет.";
    } else {
      applicationStatus = "Одобрена";
    }

    callback(applicationStatus, rejectionReason);
  };

  if (skipTimeout) {
    processApplication(); // Без задержки для тестов
  } else {
    setTimeout(processApplication, 5000); // С задержкой в продакшн-коде
  }
};

// Функция для рассылки уведомлений конкретному пользователю
const notifyTelegramUser = (applicationData) => {
  const userId = process.env.TG_ID; // ID единственного пользователя, которому отправляется сообщение
  const downPayment = applicationData.downPayment
    ? `${applicationData.downPayment} ₽`
    : "Кредит не ипотечный";

  let message = `
    Новая заявка на кредит:
    Имя: ${applicationData.name}
    Телефон: ${applicationData.phone}
    Email: ${applicationData.email}
    Адрес: ${applicationData.address}
    Дата рождения: ${applicationData.birthDate}
    Семейное положение: ${applicationData.maritalStatus}
    Ежемесячный доход: ${applicationData.salary}
    Тип занятости: ${applicationData.employmentType}
    Cумма кредита: ${applicationData.loanAmount} ₽
    Срок: ${applicationData.loanTerm} лет
    Ставка: ${applicationData.interestRate}%
    Назначение кредита: ${applicationData.loanPurpose}
    Сумма первоначального взноса: ${downPayment} ₽
    Статус: ${applicationData.approvalStatus}
  `;

  try {
    bot.sendMessage(userId, message);
  } catch (error) {
    console.error(
      `Ошибка при отправке сообщения пользователю ${userId}:`,
      error
    );
  }
};

// Функция для сохранения заявки в базу данных и отправки уведомления
const saveToDatabase = async (data) => {
  const query = `
    INSERT INTO loan_applications (
      name, phone, email, address, birth_date, marital_status, salary, 
      employment_type, loan_amount, loan_term, interest_rate, approval_status,purpose,down_payment,submitted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 ,$14, $15)
  `;

  const values = [
    data.name,
    data.phone,
    data.email,
    data.address,
    data.birthDate,
    data.maritalStatus,
    parseInt(data.salary, 10),
    data.employmentType,
    parseFloat(data.loanAmount),
    parseInt(data.loanTerm, 10),
    parseFloat(data.interestRate),
    data.approvalStatus,
    data.loanPurpose,
    parseInt(
      data.downPayment === "Кредит не является ипотечным"
        ? 0
        : data.downPayment,
      10
    ),
    new Date(data.submittedAt),
  ];

  try {
    await pool.query(query, values);
    console.log("Данные успешно сохранены в базу данных PostgreSQL.");
    notifyTelegramUser(data);
  } catch (err) {
    console.error("Ошибка при сохранении в базу данных:", err);
  }
};

// Функция для расчета ежемесячного платежа
function calculateMonthlyPayment(loanAmount, loanTerm, interestRate) {
  const monthlyInterestRate = parseFloat(interestRate) / 100 / 12;
  const numberOfPayments = parseFloat(loanTerm) * 12;

  if (monthlyInterestRate === 0) {
    return loanAmount / numberOfPayments;
  }

  return (
    (loanAmount * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) +
    1
  );
}

module.exports = { calculateMonthlyPayment };

// Маршрут для расчета ежемесячного платежа
app.post("/calculatePayment", (req, res) => {
  const { loanAmount, loanTerm, interestRate } = req.body;

  // Проверка входных данных
  if (!loanAmount || !loanTerm || !interestRate) {
    return res.status(400).json({
      error: "Необходимо указать сумму кредита, срок и процентную ставку.",
    });
  }

  // Вызов функции расчета
  const monthlyPayment = calculateMonthlyPayment(
    parseFloat(loanAmount),
    parseFloat(loanTerm),
    parseFloat(interestRate)
  );

  res.json({ monthlyPayment });
});

// Обработчик POST-запроса с проверкой времени последней отправки
app.post("/submitApplication", (req, res) => {
  const applicationData = req.body;
  const userIdentifier = applicationData.phone; // или applicationData.email
  const submissionDelay = process.env.SUBMISSION_DELAY || 30000; // 30 секунд или значение из .env

  const lastSubmission = lastSubmissionTime.get(userIdentifier);
  const currentTime = new Date().getTime();

  if (lastSubmission && currentTime - lastSubmission < submissionDelay) {
    return res.status(429).json({
      status: "error",
      message: "Пожалуйста, подождите минуту перед отправкой новой заявки.",
    });
  }

  lastSubmissionTime.set(userIdentifier, currentTime);

  // Продолжение обработки заявки после успешной валидации
  approveLoan(applicationData, async (applicationStatus, rejectionReason) => {
    applicationData.approvalStatus = applicationStatus;
    applicationData.rejectionReason = rejectionReason;
    await saveToDatabase(applicationData);

    if (applicationStatus === "Одобрена") {
      res.json({
        status: "success",
        message: `Ваша заявка ${applicationStatus}. Поздравляем!`,
      });
    } else if (applicationStatus === "Ограниченные условия") {
      res.json({
        status: "success",
        message: `Ваша заявка ${applicationStatus}. ${rejectionReason}`,
      });
    } else {
      res.json({
        status: "error",
        message: `Заявка отклонена. Причина: ${
          rejectionReason || "Причина не указана."
        }`,
      });
    }
  });
});

module.exports = app; // Экспорт самого приложения

module.exports = {
  app, // Экспорт приложения
  calculateAge, // Экспорт функции расчета возраста
  approveLoan, // Экспорт логики одобрения кредита
  calculateMonthlyPayment, // Экспорт функции расчета ежемесячного платежа
  saveToDatabase, // Экспорт функции для сохранения в базу данных
};
