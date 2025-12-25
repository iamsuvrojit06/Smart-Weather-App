const API_KEY = "3ac503d7cedbb70280e3299cc03a3924"; 

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const voiceBtn = document.getElementById("voice-btn");
const speakBtn = document.getElementById("speak-btn");
const themeToggle = document.getElementById("theme-toggle");
const result = document.getElementById("weather-result");
const forecast = document.getElementById("forecast-container");

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new Recognition();
  recognizer.lang = "en-US";
  recognizer.continuous = false;

  voiceBtn.onclick = () => {
    voiceBtn.textContent = "🎙 Listening...";
    recognizer.start();
  };

  recognizer.onresult = (e) => {
    const city = e.results[0][0].transcript;
    cityInput.value = city;
    getWeather(city);
    voiceBtn.textContent = "🎤 Voice Search";
  };

  recognizer.onerror = () => {
    voiceBtn.textContent = "🎤 Voice Search";
    alert("Voice recognition failed.");
  };
}

speakBtn.onclick = () => {
  if ('speechSynthesis' in window && result.innerText !== "") {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(result.innerText);
    window.speechSynthesis.speak(speech);
  }
};

themeToggle.onclick = () => {
  const html = document.body;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
};

async function getWeather(city) {
  result.innerHTML = "<p>Loading...</p>";
  forecast.innerHTML = "";

  try {
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherURL),
      fetch(forecastURL)
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod !== 200) throw new Error(weatherData.message);

    showWeather(weatherData);
    showForecast(forecastData.list);
  } catch (err) {
    result.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function showWeather(data) {
  const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  result.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <img src="${icon}" alt="Weather icon">
    <p class="temp">${data.main.temp} °C</p>
    <p>${data.weather[0].description}</p>
    <p>Humidity: ${data.main.humidity}%</p>
  `;
}

function showForecast(list) {
  const days = {};
  list.forEach(item => {
    const date = new Date(item.dt_txt);
    const day = date.toDateString();
    if (!days[day] && date.getHours() === 12 && Object.keys(days).length < 4) {
      days[day] = item;
    }
  });

  for (let key in days) {
    const d = days[key];
    const icon = `https://openweathermap.org/img/wn/${d.weather[0].icon}.png`;
    forecast.innerHTML += `
      <div class="forecast-card">
        <p><strong>${new Date(d.dt_txt).toLocaleDateString(undefined, { weekday: "short" })}</strong></p>
        <img src="${icon}" alt="">
        <p>${d.main.temp.toFixed(1)} °C</p>
        <p style="font-size: 0.9em;">${d.weather[0].description}</p>
      </div>
    `;
  }
}

// Auto detect user location on load
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        cityInput.value = data.name;
        getWeather(data.name);
      } catch {
        console.log("Geolocation fetch failed.");
      }
    });
  }
};
