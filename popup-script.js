// Показ попапа с ошибкой валидации
function showValidationPopup(message) {
  const validationPopup = document.getElementById("validationErrorPopup");
  const validationMessage = document.getElementById("validationErrorMessage");

  if (!validationPopup || !validationMessage) {
    console.error("Попап для ошибки валидации не найден");
    return;
  }

  validationMessage.textContent = message;
  validationPopup.classList.remove("hidden");
}

// Показ попапа для успешной отправки
function showSuccessPopup(messageSuccess, autoClose = false) {
  const successPopup = document.getElementById("FormDoneSuccess");
  const successMessage = document.getElementById("FormDoneSuccessMessage");

  successMessage.textContent = messageSuccess;
  successPopup.classList.remove("hidden");

  if (autoClose) {
    setTimeout(() => {
      successPopup.classList.add("hidden");
    }, 3000);
  }
}

// Показ попапа для ошибки при отправке
function showErrorPopup(messageError) {
  const errorPopup = document.getElementById("FormDoneError");
  const errorMessage = document.getElementById("FormDoneErrorMessage");

  errorMessage.textContent = messageError;
  errorPopup.classList.remove("hidden");
}

function showInfoPopup(messageInfo) {
  const infoPopup = document.getElementById("InfoApplicationPopup");
  const infoMessage = document.getElementById("InfoApplicationMessage");

  infoMessage.textContent = messageInfo;
  infoPopup.classList.remove("hidden");
}

// Закрытие попапов
function closePopups() {
  const popups = document.querySelectorAll(".popup");
  popups.forEach((popup) => {
    popup.classList.add("hidden");
  });
}
