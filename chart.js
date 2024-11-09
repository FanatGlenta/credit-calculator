// Retrieve data from local storage
const loanAmount = parseFloat(localStorage.getItem("loanAmount"));
const loanTerm = parseFloat(localStorage.getItem("loanTerm"));
const interestRate =
  parseFloat(localStorage.getItem("interestRate")) / 100 / 12;
const monthlyPayment = parseFloat(localStorage.getItem("monthlyPayment"));

// Generate payment data
const paymentData = {
  labels: Array.from({ length: loanTerm * 12 }, (_, i) => `${i + 1}`), // Generate labels for months
  datasets: [
    {
      label: "Основной платеж, ₽",
      data: [],
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.4,
    },
    {
      label: "Процент в платеже, ₽",
      data: [],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.4,
    },
  ],
};

// Calculate payments for each month
let remainingBalance = loanAmount;
for (let i = 1; i <= loanTerm * 12; i++) {
  const interestPayment = remainingBalance * interestRate;
  const principalPayment = monthlyPayment - interestPayment;

  // Push calculated data into datasets
  paymentData.datasets[0].data.push(principalPayment);
  paymentData.datasets[1].data.push(interestPayment);

  remainingBalance -= principalPayment; // Reduce the balance
}

// Create the chart with the dynamic data
const ctx = document.getElementById("paymentChart").getContext("2d");
const config = {
  type: "line",
  data: paymentData,
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "График ежемесячных платежей по кредиту",
        font: { size: 18 },
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Месяцы", font: { size: 14 } },
      },
      y: {
        title: { display: true, text: "Сумма платежа, ₽", font: { size: 14 } },
        beginAtZero: false,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  },
};

const paymentChart = new Chart(ctx, config);
