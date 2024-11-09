// Функция для отображения и скрытия чат-бота
function toggleChatbot() {
  const chatbot = document.getElementById("chatbot");
  const openChatbotButton = document.querySelector(".open-chatbot");

  window.addEventListener("beforeunload", function () {
    sessionStorage.removeItem("chatbotOpened");
  });

  if (chatbot.style.display === "none" || !chatbot.style.display) {
    chatbot.style.display = "block";
    openChatbotButton.style.display = "none"; // Скрыть кнопку вызова

    // Проверяем, открывается ли чат-бот впервые в рамках текущей сессии
    if (!sessionStorage.getItem("chatbotOpened")) {
      // Отобразить приветственное сообщение только при первом открытии в рамках сессии
      displayWelcomeMessage();
      // Устанавливаем флаг в sessionStorage
      sessionStorage.setItem("chatbotOpened", "true");
    }
  } else {
    chatbot.style.display = "none";
    openChatbotButton.style.display = "block"; // Показать кнопку вызова
  }
}

// Функция для отображения приветственного сообщения
function displayWelcomeMessage() {
  const welcomeMessage =
    "Здравствуйте! Я ваш помощник. Я могу помочь вам с информацией о кредитах, подаче заявок и процентных ставках. Задайте вопрос, и я постараюсь помочь!";
  displayMessage(welcomeMessage, "bot");
}

// Функция для отправки сообщения и получения ответа
async function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const userMessage = chatInput.value.trim();

  if (userMessage) {
    // Отобразить сообщение пользователя
    displayMessage(userMessage, "user");
    chatInput.value = "";

    setTimeout(() => {
      // Отобразить ответ ассистента через 1 секунду
      const response = getBotResponse(userMessage);
      displayMessage(response, "bot");
    }, 500);
  }
}

// Функция для отображения сообщений в чате с временем
function displayMessage(message, sender) {
  const messagesContainer = document.getElementById("chatbotMessages");

  // Создаем контейнер для сообщения
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender);

  // Добавляем текст сообщения
  const textElement = document.createElement("span");
  textElement.classList.add("message-text");
  textElement.innerText = message;

  // Добавляем время сообщения
  const timeElement = document.createElement("span");
  timeElement.classList.add("message-time");

  const currentTime = new Date();
  const hours = String(currentTime.getHours()).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  timeElement.innerText = `${hours}:${minutes}`;

  // Вставляем аватар, текст и время в контейнер сообщения
  if (sender === "user") {
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);
  } else {
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);
  }

  // Добавляем сообщение в контейнер сообщений
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Простая функция для ответа ассистента
function getBotResponse(message) {
  message = message.toLowerCase();

  if (message.includes("кредит")) {
    const responses = [
      "Конечно, я могу помочь с расчетом кредита. Воспользуйтесь нашим кредитным калькулятором для удобства!",
      "Вы хотите узнать больше о кредите? Я могу подсказать, как рассчитать сумму платежа и подобрать оптимальные условия.",
      "Для получения подробной информации о кредитах воспользуйтесь нашим калькулятором – это просто и удобно!",
      "Обратите внимание, что для расчета кредита лучше всего подойдет наш онлайн-калькулятор. Какую сумму вас интересует?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (message.includes("заявка")) {
    const responses = [
      "Чтобы подать заявку, пожалуйста, заполните форму. Это займет всего несколько минут!",
      "Вы можете подать заявку прямо сейчас, заполнив нашу форму онлайн.",
      "Форма заявки уже ждет вас! Мы сделаем все, чтобы процесс был быстрым и удобным.",
      "Для подачи заявки просто перейдите в раздел оформления и заполните необходимые поля.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (message.includes("ставка")) {
    const responses = [
      "Процентная ставка зависит от типа кредита. Выберите подходящий вариант в калькуляторе.",
      "Хотите узнать про ставки? Они зависят от срока и типа кредита – уточните это в нашем калькуляторе.",
      "Ставка варьируется в зависимости от условий и типа кредита. Укажите цель кредита для точного расчета.",
      "Для получения актуальной информации о ставках, выберите желаемый тип кредита – мы предоставим расчет.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else {
    const responses = [
      "Извините, я пока не понимаю ваш вопрос. Попробуйте переформулировать его или спросите о кредите, заявке или ставке.",
      "Возможно, вы хотите узнать что-то о кредите? Я могу ответить на вопросы по кредитам, ставкам и заявкам.",
      "Попробуйте задать вопрос иначе. На данный момент я могу помочь с вопросами о кредитах, заявках и процентных ставках.",
      "Мне пока сложно понять ваш вопрос. Пожалуйста, уточните, если он касается кредитов, ставок или подачи заявок.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
