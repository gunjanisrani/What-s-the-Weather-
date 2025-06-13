let selectedCity = null; 
let currentWeatherData = null; // To hold current weather data for the selected city
const globe = new Globe(document.getElementById('globe_container'))
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png');

function animate() {
    requestAnimationFrame(animate);  
    globe.controls().update();
}

animate();
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.5;

document.getElementById('globe_container').addEventListener('click', function () {
    globe.controls().autoRotate = !globe.controls().autoRotate;
    globe.controls().update();
});

const rotateToggle = document.getElementById('rotateToggle');
const toggleLabel = document.getElementById('toggleLabel');
rotateToggle.addEventListener('change', function() {
    const isOn = rotateToggle.checked;
    globe.controls().autoRotate = isOn;
    globe.controls().update();
    toggleLabel.textContent = `Auto-Rotate: ${isOn ? "ON" : "OFF"}`;
});

let cityData = []; // Will hold filtered cities
let currentHover = null;

//Load and filter cities
fetch('../js/data/worldcities.json')
    .then(res => res.json())
    .then(data => {
        cityData = data.filter(city => city.population && city.population > 500000);
        updateLabels(cityData);
    });

//City name shows when hovered above
function updateLabels(cities) {
    globe.labelsData(cities)
        .labelLat(d => +d.lat)
        .labelLng(d => +d.lng)
        .labelText(d => {
            if (selectedCity && d.city === selectedCity.city) return d.city;
            if (currentHover && d.city === currentHover.city) return d.city;
            return '';
        })
        .labelSize(d => (selectedCity && d.city === selectedCity.city) ? 1.7 : 1.2)  // Bigger size for selected
        .labelColor(d => {
            if (selectedCity && d.city === selectedCity.city) return 'yellow';  // Highlight color
            if (currentHover && d.city === currentHover.city) return 'white';      // Hover color
            return 'white';                                                      // Normal color
        })
        .labelResolution(2) // Higher resolution for better quality

}

const isMobile = window.innerWidth <= 600;
globe.labelSize(d => {
    if (selectedCity && d.city === selectedCity.city) return isMobile ? 1.2 : 1.7;
    return isMobile ? 0.5 : 1.2;
});

globe.onLabelHover(d => {
    if (!d || d.city !== (currentHover && currentHover.city)) {
        currentHover = d;
        updateLabels(cityData);
    }
});

globe.onLabelClick(city => {
    if (!city) return;

    // Show weather and hide globe
    fetchWeather(city.lat, city.lng, city.city);
    document.getElementById('globe_container').style.display = 'none';
});


//Autocomplete search
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');

function handleCitySelect(city) {
    selectedCity = city;
    // Focus camera
    globe.pointOfView({
        lat: +city.lat,
        lng: +city.lng,
        altitude: 0.6
    }, 3000); // 3 second zoom


    // Stop auto-rotation once zoomed
    setTimeout(() => {
        globe.controls().autoRotate = false;
        globe.controls().update();
    }, 2000);

    // Temporarily highlight selected city
    currentHover = city;
    selectedCity = city;
    updateLabels(cityData);

    // Clear dropdown
    suggestionsList.innerHTML = '';
    searchInput.value = `${city.city}`;
}

// Handle input in search box
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    suggestionsList.innerHTML = '';

    if (!query) return;

    const matches = cityData
        .filter(city => city.city.toLowerCase().startsWith(query))
        .slice(0, 3); // only top 3

    matches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city.city;
        li.addEventListener('click', () => handleCitySelect(city));
        suggestionsList.appendChild(li);
    });
});

// When a city is selected from dropdown
const API_KEY = '9f71e7009a7b2ef725e994d9d02c0ada'; 

async function fetchWeather(lat, lon, cityName) {
    lat = parseFloat(lat);
    lon = parseFloat(lon);
    if (isNaN(lat) || isNaN(lon)) {
        alert('Invalid coordinates for weather data.');
        return;
    }
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const data = await res.json();
        updateWeatherCard(cityName, data);
    } catch (error) {
        console.error(error);
        alert('Error fetching weather data. Please try again later.');
    }

    try{
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch forecast data');
        const forecastData = await res.json();
        updateForecastCard(cityName, forecastData);
    }
    catch (error) {
        console.error(error);
        alert('Error fetching forecast data. Please try again later.');
    }
}

async function updateWeatherCard(cityName, data) {
    currentWeatherData = data; // Store current weather data
    const card = document.getElementById('weatherCard');
    card.classList.remove('hidden');

    document.getElementById('cityName').textContent = cityName;
    document.getElementById('temperature').textContent = `${data.main.temp}°C `;
    document.getElementById('weatherIcon').textContent = getWeatherIcon(data.weather[0].icon);
    document.getElementById('description').textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    document.getElementById('feelsLike').textContent = `Feels like: ${data.main.feels_like}°C`;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `Wind Speed: ${data.wind.speed} m/s`;
    document.getElementById('localTime').textContent = `Local Time: ${getLocalTimeFromOffset(data.timezone)}`;

    updateWeatherBackground(data.weather[0].description.toLowerCase());
    document.getElementById('weatherVideoBg').classList.remove('hidden');
    document.getElementById('search_bar').style.display = 'none';
    document.getElementById('toggle_container').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
}

function updateWeatherBackground(condition) {
    const video = document.getElementById('weatherVideoBg');
    let src = './videos/sunny.mp4'; // default

    if (condition.includes('rain')) src = '../videos/rain.mp4';
    else if (condition.includes('snow')) src = '../videos/snow.mp4';
    else if (condition.includes('cloud')) src = '../videos/cloudy.mp4';
    else if (condition.includes('thunder')) src = '../videos/thunder.mp4';
    else if (condition.includes('clear')) src = '../videos/sunny.mp4';

    if (video.querySelector('source').src !== src) {
        video.pause();
        video.querySelector('source').src = src;
        video.load();
        video.play();
    }
}

async function updateForecastCard(cityName, data) {
    const forecastCard = document.getElementById('forecastCard');
    forecastCard.classList.remove('hidden');

    const forecastList = document.getElementById('forecastList');
    forecastList.innerHTML = ''; // Clear previous data

    // Group by date
    const todayDate = new Date().toISOString().split('T')[0];
    const groupedForecast = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if(date===todayDate) return; // Skip today's forecast
        if (!groupedForecast[date]) {
            groupedForecast[date] = [];
        }
        groupedForecast[date].push(item);
    });
    
    // Create forecast items
    Object.keys(groupedForecast).forEach(date => {
        const items = groupedForecast[date];
        const avgTemp = items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
        const iconCode = items[0].weather[0].icon;
        const description = items[0].weather[0].description;


        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${new Date(date).toLocaleDateString()}</strong><br>
            ${getWeatherIcon(iconCode)} ${description.charAt(0).toUpperCase() + description.slice(1)}<br>
            Avg Temp: ${avgTemp.toFixed(1)}°C `;
        forecastList.appendChild(li);
    });

    document.getElementById('backToGlobe').classList.remove('hidden');
    document.getElementById('screenReader').classList.remove('hidden');
}

// Map icon code to emoji
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '🌤️', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
return iconMap[iconCode] || '🌡️';
}

//Get local time string from offset seconds
function getLocalTimeFromOffset(offsetSeconds) {
    const now = new Date();

    // Get current UTC time in milliseconds
    const utcMillis = now.getTime() + (now.getTimezoneOffset() * 60000);

    // Add offset in milliseconds
    const localMillis = utcMillis + offsetSeconds * 1000;
    const localDate = new Date(localMillis);
    return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Handle "Speak Weather" button click
let isSpeaking = false;
let isPaused = false;
let speech = null;

document.getElementById('screenReader').addEventListener('click', () => {
    if (!currentWeatherData || !selectedCity) return;
    speakWeather(selectedCity.city, currentWeatherData);
    document.getElementById('screenReader').disabled = true; // Disable button after speaking
});

//text to speech
function speakWeather(cityName,data){
    if (!isSpeaking) {
        const textMessage = `The current weather in ${cityName} is ${data.weather[0].description} with a temperature
        of ${data.main.temp} degrees Celsius which feels like ${data.main.feels_like} degree celsius. The humidity 
        is ${data.main.humidity} percent, and the wind speed is ${data.wind.speed} meters per second. The local time
        in ${cityName} is ${getLocalTimeFromOffset(data.timezone)}.`;

        speech = new SpeechSynthesisUtterance(textMessage);
        speech.lang = 'en-IN';
        speech.volume = 0.8;
        speech.rate = 1; // Normal speed
        speech.pitch = 1; // Normal pitch

        speech.onend = () => {
            isSpeaking = false;
            isPaused = false;
            speech = null;
            document.getElementById('screenReader').textContent = "🔊 Read Weather";
        }

        speechSynthesis.speak(speech);
        isSpeaking = true;
        document.getElementById('screenReader').textContent = "⏸️ Pause Reading";
    }

    else if (isSpeaking && !isPaused) {
        speechSynthesis.pause();
        isPaused = true;
        document.getElementById('screenReader').textContent = "▶️ Resume Reading";
    }

    else {
        speechSynthesis.resume();
        isPaused = false;
        document.getElementById('screenReader').textContent = "⏸️ Pause Reading";
    }
}

// Handle "Back to Globe" button click
document.getElementById('backToGlobe').addEventListener('click', () => {
    selectedCity = null;
    currentWeatherData = null;
    currentHover = null;
    searchInput.value = null; // Clear search input
    suggestionsList.innerHTML = ''; // Clear suggestions
    updateLabels(cityData);
    globe.controls().autoRotate = true; // Re-enable auto-rotation
});
