document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value;
    getWeather(city);
});

async function getWeather(city) {
    const apiKey = '4e101a5af1ae2a4d8317288c808d28fb'; // Your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    console.log(`Fetching weather data for city: ${city}`);
    console.log(`Using API Key: ${apiKey}`);
    console.log(`Request URL: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log(`API Response:`, data); // Log the full response for debugging

        if (response.ok) {
            displayWeather(data);
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again later.');
    }
}

function displayWeather(data) {
    const weatherDataDiv = document.getElementById('weather-data');
    weatherDataDiv.style.display = 'block';
    weatherDataDiv.innerHTML = `
        <p><strong>City:</strong> ${data.name}</p>
        <p><strong>Temperature:</strong> ${data.main.temp} °C</p>
        <p><strong>Weather:</strong> ${data.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${data.main.humidity} %</p>
        <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
    `;
}
