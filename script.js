// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load theme preference
    loadTheme();
    
    // Load search history
    loadSearchHistory();
    
    // Focus on input field
    document.getElementById('city').focus();
}

// Search History functionality
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

function loadSearchHistory() {
    if (searchHistory.length > 0) {
        document.getElementById('search-history').style.display = 'block';
        displayHistory();
    }
}

function addToHistory(city) {
    // Remove duplicates and limit to 5 items
    searchHistory = searchHistory.filter(item => 
        item.toLowerCase() !== city.toLowerCase()
    );
    searchHistory.unshift(city);
    searchHistory = searchHistory.slice(0, 5);
    
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    searchHistory.forEach(city => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = city;
        historyItem.addEventListener('click', () => {
            document.getElementById('city').value = city;
            getWeather(city);
        });
        historyList.appendChild(historyItem);
    });
    
    document.getElementById('search-history').style.display = 'block';
}

// Theme functionality
function loadTheme() {
    const savedTheme = localStorage.getItem('weatherAppTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('weatherAppTheme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
}

// Event listeners
document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    getWeather(city);
});

document.getElementById('location-btn').addEventListener('click', function() {
    getLocationWeather();
});

document.getElementById('theme-btn').addEventListener('click', toggleTheme);

document.getElementById('city').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('weather-form').dispatchEvent(new Event('submit'));
    }
});

// Main weather functions
async function getWeather(city) {
    hideElements();
    document.getElementById('loading').style.display = 'block';
    
    try {
        const apiKey = '4e101a5af1ae2a4d8317288c808d28fb'; 
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.cod === 200) {
            displayWeather(data);
            addToHistory(city);
            getForecast(city);
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        
        let errorMessage = 'Error fetching weather data. Please try again later.';
        
        if (error.message.includes('404')) {
            errorMessage = 'City not found. Please check the spelling and try again.';
        } else if (error.message.includes('401')) {
            errorMessage = 'API key issue. Please contact the administrator.';
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        showError(errorMessage);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon);
            },
            error => {
                showError('Unable to retrieve your location. Please enable location services.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

async function getWeatherByCoords(lat, lon) {
    hideElements();
    document.getElementById('loading').style.display = 'block';
    
    try {
        const apiKey = '4e101a5af1ae2a4d8317288c808d28fb';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data);
            addToHistory(data.name);
            getForecast(data.name);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching weather by location:', error);
        showError('Error getting location weather. Please try again.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Forecast functionality
async function getForecast(city) {
    try {
        const apiKey = '4e101a5af1ae2a4d8317288c808d28fb';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayForecast(data);
        }
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

function displayForecast(data) {
    const forecastDiv = document.getElementById('forecast');
    
    // Get daily forecasts (one per day at 12:00)
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    let forecastHTML = '<h3>📅 5-Day Forecast</h3><div class="forecast-container">';
    
    dailyForecasts.slice(0, 5).forEach(day => {
        const date = new Date(day.dt_txt);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        
        forecastHTML += `
            <div class="forecast-day">
                <div class="forecast-date">${dayName}</div>
                <img src="${iconUrl}" alt="${day.weather[0].description}" width="40" height="40">
                <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
                <div class="forecast-desc">${day.weather[0].description}</div>
            </div>
        `;
    });
    
    forecastHTML += '</div>';
    forecastDiv.innerHTML = forecastHTML;
    forecastDiv.style.display = 'block';
}

function displayWeather(data) {
    const weatherDataDiv = document.getElementById('weather-data');
    
    const temperature = Math.round(data.main.temp * 10) / 10;
    const feelsLike = Math.round(data.main.feels_like);
    const description = data.weather[0].description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    
    weatherDataDiv.innerHTML = `
        <h2>Weather in ${data.name}, ${data.sys.country}</h2>
        <div style="text-align: center; margin: 15px 0;">
            <img src="${iconUrl}" alt="${description}" style="width: 80px; height: 80px;">
            <div style="font-size: 1.2rem; font-weight: bold; margin: 10px 0;">${description}</div>
        </div>
        <p><strong>Temperature:</strong> ${temperature} °C</p>
        <p><strong>Feels Like:</strong> ${feelsLike} °C</p>
        <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
        <p><strong>Pressure:</strong> ${data.main.pressure} hPa</p>
        <p><strong>Visibility:</strong> ${(data.visibility / 1000).toFixed(1)} km</p>
    `;
    
    weatherDataDiv.style.display = 'block';
}

// Utility functions
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideElements() {
    document.getElementById('weather-data').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('forecast').style.display = 'none';
}