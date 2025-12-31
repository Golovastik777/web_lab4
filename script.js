const WEATHER_API_KEY = '4d8fb5b93d4af21d66a2948710284366';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0';

const state = {
    cities: [],
    currentCityIndex: 0,
    isLoading: false,
    isLocationAllowed: null,
    theme: localStorage.getItem('theme') || 'light'
};

const weatherCache = {};

const popularCities = [
    { name: 'Москва', country: 'RU', lat: 55.7558, lon: 37.6173 },
    { name: 'Санкт-Петербург', country: 'RU', lat: 59.9343, lon: 30.3351 },
    { name: 'Новосибирск', country: 'RU', lat: 55.0084, lon: 82.9357 },
    { name: 'Екатеринбург', country: 'RU', lat: 56.8389, lon: 60.6057 },
    { name: 'Казань', country: 'RU', lat: 55.7961, lon: 49.1064 },
    { name: 'Нижний Новгород', country: 'RU', lat: 56.3269, lon: 44.0075 },
    { name: 'Красноярск', country: 'RU', lat: 56.0184, lon: 92.8672 },
    { name: 'Челябинск', country: 'RU', lat: 55.1644, lon: 61.4368 },
    { name: 'Самара', country: 'RU', lat: 53.1959, lon: 50.1002 },
    { name: 'Уфа', country: 'RU', lat: 54.7355, lon: 55.9917 },
    { name: 'Ростов-на-Дону', country: 'RU', lat: 47.2357, lon: 39.7015 },
    { name: 'Омск', country: 'RU', lat: 54.9885, lon: 73.3242 },
    { name: 'Краснодар', country: 'RU', lat: 45.0448, lon: 38.976 },
    { name: 'Воронеж', country: 'RU', lat: 51.6606, lon: 39.2006 },
    { name: 'Пермь', country: 'RU', lat: 58.0105, lon: 56.2502 },
    { name: 'Волгоград', country: 'RU', lat: 48.708, lon: 44.5133 }
];

const weatherIcons = {
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun',
    '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud',
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain',
    '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt',
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

const elements = {
    citiesList: document.getElementById('citiesList'),
    weatherContainer: document.getElementById('weatherContainer'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    weatherContent: document.getElementById('weatherContent'),
    locationName: document.getElementById('locationName'),
    currentDate: document.getElementById('currentDate'),
    currentTemp: document.getElementById('currentTemp'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    feelsLikeTemp: document.getElementById('feelsLikeTemp'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    forecastDays: document.getElementById('forecastDays'),
    refreshBtn: document.getElementById('refreshBtn'),
    addCityBtn: document.getElementById('addCityBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    addCityModal: document.getElementById('addCityModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelAddCityBtn: document.getElementById('cancelAddCityBtn'),
    cityInput: document.getElementById('cityInput'),
    suggestionsContainer: document.getElementById('suggestionsContainer'),
    cityError: document.getElementById('cityError'),
    confirmAddCityBtn: document.getElementById('confirmAddCityBtn'),
    locationPermissionModal: document.getElementById('locationPermissionModal'),
    allowLocationBtn: document.getElementById('allowLocationBtn'),
    denyLocationBtn: document.getElementById('denyLocationBtn')
};

function init() {
    loadStateFromStorage();
    setupEventListeners();
    applyTheme(state.theme);
    
    if (state.cities.length > 0) {
        elements.locationPermissionModal.classList.add('hidden');
        updateWeatherForCurrentCity();
    } else {
        elements.locationPermissionModal.classList.remove('hidden');
    }
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem('weatherAppState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.cities = parsedState.cities || [];
        state.currentCityIndex = parsedState.currentCityIndex || 0;
    }
}

function saveStateToStorage() {
    localStorage.setItem('weatherAppState', JSON.stringify({
        cities: state.cities,
        currentCityIndex: state.currentCityIndex
    }));
}

function setupEventListeners() {
    elements.refreshBtn.addEventListener('click', () => {
        updateAllCitiesWeather();
    });
    
    elements.addCityBtn.addEventListener('click', () => {
        showAddCityModal();
    });
    
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    
    elements.closeModalBtn.addEventListener('click', () => {
        elements.addCityModal.classList.add('hidden');
        clearCityForm();
    });
    
    elements.cancelAddCityBtn.addEventListener('click', () => {
        elements.addCityModal.classList.add('hidden');
        clearCityForm();
    });
    
    elements.confirmAddCityBtn.addEventListener('click', addCity);
    
    elements.cityInput.addEventListener('input', handleCityInput);
    
    elements.allowLocationBtn.addEventListener('click', requestGeolocation);
    elements.denyLocationBtn.addEventListener('click', () => {
        elements.locationPermissionModal.classList.add('hidden');
        showAddCityModal();
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.addCityModal) {
            elements.addCityModal.classList.add('hidden');
            clearCityForm();
        }
    });
    
    elements.cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addCity();
        }
    });
}

function toggleTheme() {
    if (state.theme === 'light') {
        state.theme = 'night';
        document.body.classList.add('night-mode');
        elements.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Дневной режим';
    } else {
        state.theme = 'light';
        document.body.classList.remove('night-mode');
        elements.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Ночной режим';
    }
    localStorage.setItem('theme', state.theme);
}

function applyTheme(theme) {
    if (theme === 'night') {
        document.body.classList.add('night-mode');
        elements.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Дневной режим';
    } else {
        document.body.classList.remove('night-mode');
        elements.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Ночной режим';
    }
}

function showAddCityModal() {
    elements.addCityModal.classList.remove('hidden');
    elements.cityInput.focus();
}

function clearCityForm() {
    elements.cityInput.value = '';
    elements.suggestionsContainer.innerHTML = '';
    elements.cityError.textContent = '';
    elements.cityError.classList.add('hidden');
}

function handleCityInput() {
    const query = elements.cityInput.value.trim();
    elements.suggestionsContainer.innerHTML = '';
    
    if (query.length < 2) return;
    
    const filteredCities = popularCities.filter(city => 
        city.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredCities.length > 0) {
        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'suggestions-list';
        
        filteredCities.slice(0, 5).forEach(city => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = `${city.name}, ${city.country}`;
            suggestionItem.addEventListener('click', () => {
                elements.cityInput.value = city.name;
                elements.suggestionsContainer.innerHTML = '';
            });
            suggestionsList.appendChild(suggestionItem);
        });
        
        elements.suggestionsContainer.appendChild(suggestionsList);
    }
}

async function addCity() {
    const cityName = elements.cityInput.value.trim();
    
    if (!cityName) {
        showCityError('Введите название города');
        return;
    }
    
    if (state.cities.some(city => city.name.toLowerCase() === cityName.toLowerCase())) {
        showCityError('Этот город уже добавлен');
        return;
    }
    
    const cityData = popularCities.find(city => 
        city.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (!cityData) {
        showCityError('Город не найден. Выберите город из списка');
        return;
    }
    
    elements.locationPermissionModal.classList.add('hidden');
    
    const newCity = {
        id: Date.now(),
        name: cityData.name,
        country: cityData.country,
        lat: cityData.lat,
        lon: cityData.lon,
        isCurrentLocation: false
    };
    
    state.cities.push(newCity);
    
    if (state.cities.length === 1) {
        state.currentCityIndex = 0;
    }
    
    saveStateToStorage();
    updateCitiesList();
    updateWeatherForCurrentCity();
    
    elements.addCityModal.classList.add('hidden');
    clearCityForm();
}

function showCityError(message) {
    elements.cityError.textContent = message;
    elements.cityError.classList.remove('hidden');
}

function requestGeolocation() {
    if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        elements.locationPermissionModal.classList.add('hidden');
        showAddCityModal();
        return;
    }
    
    elements.locationPermissionModal.classList.add('hidden');
    showLoadingState();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await addCityByCoordinates(latitude, longitude, true);
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            showErrorState('Не удалось определить ваше местоположение');
            setTimeout(() => {
                elements.locationPermissionModal.classList.add('hidden');
                showAddCityModal();
            }, 2000);
        }
    );
}

async function addCityByCoordinates(lat, lon, isCurrentLocation = false) {
    try {
        const response = await fetch(
            `${GEO_API_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Не удалось определить город по координатам');
        }
        
        const geoData = await response.json();
        
        if (geoData.length === 0) {
            throw new Error('Город не найден по указанным координатам');
        }
        
        const cityName = geoData[0].name;
        const country = geoData[0].country;
        
        if (state.cities.some(city => city.name === cityName && city.country === country)) {
            const existingIndex = state.cities.findIndex(
                city => city.name === cityName && city.country === country
            );
            state.currentCityIndex = existingIndex;
            saveStateToStorage();
            updateCitiesList();
            updateWeatherForCurrentCity();
            return;
        }
        
        const newCity = {
            id: Date.now(),
            name: cityName,
            country: country,
            lat: lat,
            lon: lon,
            isCurrentLocation: isCurrentLocation
        };
        
        state.cities.push(newCity);
        state.currentCityIndex = state.cities.length - 1;
        
        saveStateToStorage();
        updateCitiesList();
        updateWeatherForCurrentCity();
        
    } catch (error) {
        console.error('Ошибка при добавлении города по координатам:', error);
        showErrorState('Не удалось определить город по координатам');
        setTimeout(() => {
            showAddCityModal();
        }, 2000);
    }
}

function updateCitiesList() {
    elements.citiesList.innerHTML = '';
    
    if (state.cities.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = '<i class="fas fa-city"></i><p>Добавьте город для отображения погоды</p>';
        elements.citiesList.appendChild(emptyMessage);
        return;
    }
    
    state.cities.forEach((city, index) => {
        const cityElement = createCityElement(city, index);
        elements.citiesList.appendChild(cityElement);
    });
}

function createCityElement(city, index) {
    const cityElement = document.createElement('div');
    cityElement.className = `city-item ${index === state.currentCityIndex ? 'active' : ''}`;
    cityElement.style.animationDelay = `${index * 0.1}s`;
    
    const cachedWeather = weatherCache[city.id];
    const displayName = city.isCurrentLocation ? 
        `<i class="fas fa-location-dot"></i> Текущее местоположение` : 
        `<i class="fas fa-city"></i> ${city.name}`;
    
    let weatherHTML = '';
    if (cachedWeather && cachedWeather.current) {
        const temp = Math.round(cachedWeather.current.main.temp);
        const iconClass = weatherIcons[cachedWeather.current.weather[0].icon] || 'fas fa-question';
        weatherHTML = `
            <div class="city-item-header">
                <div class="city-name">${displayName}</div>
                <div class="city-temp">${temp}°C</div>
            </div>
            <div class="city-weather-details">
                <div class="city-weather-icon"><i class="${iconClass}"></i></div>
                <div class="city-weather-info">
                    <div class="city-description">${cachedWeather.current.weather[0].description}</div>
                    <div class="city-date">Обновлено: ${formatTime(cachedWeather.current.dt)}</div>
                </div>
            </div>
            ${index !== state.currentCityIndex ? `<button class="remove-city-btn" data-index="${index}"><i class="fas fa-times"></i></button>` : ''}
        `;
    } else {
        weatherHTML = `
            <div class="city-item-header">
                <div class="city-name">${displayName}</div>
                <div class="city-temp">--°C</div>
            </div>
            <div class="city-weather-details">
                <div class="city-weather-icon"><i class="fas fa-question"></i></div>
                <div class="city-weather-info">
                    <div class="city-description">Загрузка...</div>
                    <div class="city-date">--:--</div>
                </div>
            </div>
            ${index !== state.currentCityIndex ? `<button class="remove-city-btn" data-index="${index}"><i class="fas fa-times"></i></button>` : ''}
        `;
    }
    
    cityElement.innerHTML = weatherHTML;
    
    cityElement.addEventListener('click', () => {
        if (index !== state.currentCityIndex) {
            state.currentCityIndex = index;
            saveStateToStorage();
            updateCitiesList();
            updateWeatherForCurrentCity();
        }
    });
    
    if (index !== state.currentCityIndex) {
        const removeBtn = cityElement.querySelector('.remove-city-btn');
        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            removeCity(index);
        });
    }
    
    return cityElement;
}

function removeCity(index) {
    state.cities.splice(index, 1);
    
    if (state.currentCityIndex >= state.cities.length) {
        state.currentCityIndex = Math.max(0, state.cities.length - 1);
    }
    
    saveStateToStorage();
    updateCitiesList();
    
    if (state.cities.length > 0) {
        updateWeatherForCurrentCity();
    } else {
        showAddCityModal();
    }
}

async function updateAllCitiesWeather() {
    if (state.cities.length === 0) return;
    
    showLoadingState();
    
    try {
        for (let i = 0; i < state.cities.length; i++) {
            const city = state.cities[i];
            const weatherData = await fetchWeatherData(city);
            weatherCache[city.id] = weatherData;
        }
        
        updateCitiesList();
        
        const currentCity = state.cities[state.currentCityIndex];
        updateWeatherUI(currentCity, weatherCache[currentCity.id]);
        showWeatherContent();
    } catch (error) {
        console.error('Ошибка при обновлении погоды:', error);
        showErrorState('Не удалось обновить данные о погоде');
    }
}

async function updateWeatherForCurrentCity() {
    if (state.cities.length === 0) return;
    
    const currentCity = state.cities[state.currentCityIndex];
    showLoadingState();
    
    try {
        const weatherData = await fetchWeatherData(currentCity);
        weatherCache[currentCity.id] = weatherData;
        updateWeatherUI(currentCity, weatherData);
        updateCitiesList();
        showWeatherContent();
    } catch (error) {
        console.error('Ошибка при получении данных о погоде:', error);
        showErrorState('Не удалось загрузить данные о погоде');
    }
}

async function fetchWeatherData(city) {
    const currentWeatherUrl = `${WEATHER_API_URL}/weather?lat=${city.lat}&lon=${city.lon}&units=metric&lang=ru&appid=${WEATHER_API_KEY}`;
    const forecastUrl = `${WEATHER_API_URL}/forecast?lat=${city.lat}&lon=${city.lon}&units=metric&lang=ru&appid=${WEATHER_API_KEY}`;
    
    const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentWeatherUrl),
        fetch(forecastUrl)
    ]);
    
    if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Ошибка при получении данных о погоде');
    }
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    const forecastForThreeDays = filterForecastForThreeDays(forecastData);
    
    return {
        current: currentData,
        forecast: forecastForThreeDays
    };
}

function filterForecastForThreeDays(forecastData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const days = [today, tomorrow, dayAfterTomorrow];
    const filteredForecast = [];
    
    days.forEach(day => {
        const forecastForDay = forecastData.list.find(item => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate.getDate() === day.getDate() && 
                   itemDate.getMonth() === day.getMonth() &&
                   itemDate.getHours() === 12;
        });
        
        if (!forecastForDay) {
            const forecastsForDay = forecastData.list.filter(item => {
                const itemDate = new Date(item.dt * 1000);
                return itemDate.getDate() === day.getDate() && 
                       itemDate.getMonth() === day.getMonth();
            });
            
            if (forecastsForDay.length > 0) {
                filteredForecast.push(forecastsForDay[0]);
            }
        } else {
            filteredForecast.push(forecastForDay);
        }
    });
    
    return filteredForecast;
}

function updateWeatherUI(city, weatherData) {
    const current = weatherData.current;
    const forecast = weatherData.forecast;
    
    const displayName = city.isCurrentLocation ? 
        `<i class="fas fa-location-dot"></i> Текущее местоположение` : 
        `${city.name}, ${city.country}`;
    elements.locationName.innerHTML = displayName;
    
    elements.currentDate.textContent = formatDate(current.dt);
    elements.currentTemp.textContent = Math.round(current.main.temp);
    elements.feelsLikeTemp.textContent = Math.round(current.main.feels_like);
    
    const iconCode = current.weather[0].icon;
    elements.weatherIcon.className = weatherIcons[iconCode] || 'fas fa-question';
    
    elements.weatherDesc.textContent = current.weather[0].description;
    elements.windSpeed.textContent = current.wind.speed;
    elements.humidity.textContent = current.main.humidity;
    elements.pressure.textContent = current.main.pressure;
    elements.visibility.textContent = (current.visibility / 1000).toFixed(1);
    
    updateForecastUI(forecast);
}

function updateForecastUI(forecast) {
    elements.forecastDays.innerHTML = '';
    
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    forecast.forEach((dayForecast, index) => {
        const date = new Date(dayForecast.dt * 1000);
        const dayName = index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : daysOfWeek[date.getDay()];
        
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-day';
        forecastElement.style.animationDelay = `${index * 0.1}s`;
        
        const iconCode = dayForecast.weather[0].icon;
        const iconClass = weatherIcons[iconCode] || 'fas fa-question';
        
        forecastElement.innerHTML = `
            <div class="forecast-header">
                <div class="forecast-date">${dayName}</div>
                <div class="forecast-date-small">${formatDate(dayForecast.dt, true)}</div>
            </div>
            <div class="forecast-icon"><i class="${iconClass}"></i></div>
            <div class="forecast-temp">${Math.round(dayForecast.main.temp)}°C</div>
            <div class="forecast-desc">${dayForecast.weather[0].description}</div>
            <div class="forecast-details">
                <div class="forecast-detail">
                    <i class="fas fa-wind"></i>
                    <span>${dayForecast.wind.speed} м/с</span>
                </div>
                <div class="forecast-detail">
                    <i class="fas fa-tint"></i>
                    <span>${dayForecast.main.humidity}%</span>
                </div>
            </div>
        `;
        
        elements.forecastDays.appendChild(forecastElement);
    });
}

function formatDate(timestamp, short = false) {
    const date = new Date(timestamp * 1000);
    const options = short 
        ? { day: 'numeric', month: 'short' }
        : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    
    return date.toLocaleDateString('ru-RU', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function showLoadingState() {
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');
}

function showErrorState(message) {
    elements.errorMessage.textContent = message;
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.weatherContent.classList.add('hidden');
}

function showWeatherContent() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.weatherContent.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
