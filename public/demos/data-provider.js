class DataProvider {
    constructor() {
        this.locationData = null;
        this.weatherData = null;
        this.updateInterval = null;
        this.callbacks = new Set();
        
        this.defaultLocation = {
            lat: 37.5665,
            lon: 126.9780,
            city: 'Seoul',
            country: 'South Korea'
        };
    }

    subscribe(callback) {
        this.callbacks.add(callback);
        
        if (this.callbacks.size === 1) {
            this.startDataCollection();
        }
        
        this.notifyCallbacks();
        
        return () => {
            this.callbacks.delete(callback);
            if (this.callbacks.size === 0) {
                this.stopDataCollection();
            }
        };
    }

    async startDataCollection() {
        await this.updateLocation();
        this.notifyCallbacks();
        
        await this.updateWeather();
        this.notifyCallbacks();
        
        this.updateInterval = setInterval(async () => {
            await this.updateWeather();
            this.notifyCallbacks();
        }, 60000);
    }

    stopDataCollection() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async updateLocation() {
        try {
            if ('geolocation' in navigator) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 10000,
                        enableHighAccuracy: false
                    });
                });
                
                this.locationData = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                    source: 'gps'
                };
                
                await this.reverseGeocode();
            } else {
                throw new Error('Geolocation not supported');
            }
        } catch (error) {
            console.warn('GPS 위치 실패, IP 기반 위치 시도:', error.message);
            await this.getLocationByIP();
        }
    }

    async getLocationByIP() {
        const apis = [
            {
                url: 'https://ipapi.co/json/',
                parse: (data) => ({
                    lat: data.latitude,
                    lon: data.longitude,
                    city: data.city,
                    country: data.country_name,
                    region: data.region
                })
            },
            {
                url: 'https://ipwho.is/',
                parse: (data) => data.success ? {
                    lat: data.latitude,
                    lon: data.longitude,
                    city: data.city,
                    country: data.country,
                    region: data.region
                } : null
            },
            {
                url: 'https://geolocation-db.com/json/',
                parse: (data) => ({
                    lat: data.latitude,
                    lon: data.longitude,
                    city: data.city,
                    country: data.country_name,
                    region: data.state
                })
            }
        ];

        for (const api of apis) {
            try {
                const response = await fetch(api.url, {
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) continue;
                
                const data = await response.json();
                const parsed = api.parse(data);
                
                if (parsed && parsed.lat && parsed.lon) {
                    this.locationData = {
                        ...parsed,
                        source: 'ip'
                    };
                    console.log('IP 위치 조회 성공:', this.locationData);
                    return;
                }
            } catch (error) {
                console.warn(`${api.url} 실패:`, error.message);
            }
        }
        
        console.warn('모든 IP API 실패, 기본값 사용');
        this.locationData = { ...this.defaultLocation, source: 'default' };
    }

    async reverseGeocode() {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.locationData.lat}&lon=${this.locationData.lon}&accept-language=ko`,
                {
                    headers: {
                        'User-Agent': 'FrontGen/1.0 (https://github.com/frontgen)',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Nominatim failed');
            
            const data = await response.json();
            
            if (data && data.address) {
                this.locationData.city = data.address.city || 
                    data.address.town || 
                    data.address.village ||
                    data.address.county || 
                    data.address.state ||
                    'Unknown';
                this.locationData.country = data.address.country || 'Unknown';
                this.locationData.display_name = data.display_name;
            }
        } catch (error) {
            console.warn('역지오코딩 실패:', error.message);
            if (!this.locationData.city) {
                this.locationData.city = 'Unknown';
                this.locationData.country = 'Unknown';
            }
        }
    }

    async updateWeather() {
        if (!this.locationData) {
            await this.updateLocation();
        }

        try {
            const apiKey = 'YOUR_API_KEY';
            const lat = this.locationData.lat;
            const lon = this.locationData.lon;
            
            if (apiKey === 'YOUR_API_KEY') {
                this.weatherData = this.getSimulatedWeather();
                return;
            }
            
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
            );
            
            if (response.ok) {
                const data = await response.json();
                this.weatherData = {
                    temperature: Math.round(data.main.temp),
                    humidity: data.main.humidity,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    windSpeed: data.wind.speed,
                    pressure: data.main.pressure,
                    visibility: data.visibility / 1000,
                    sunrise: new Date(data.sys.sunrise * 1000),
                    sunset: new Date(data.sys.sunset * 1000),
                    timestamp: new Date()
                };
            }
        } catch (error) {
            console.warn('날씨 정보 가져오기 실패:', error);
            this.weatherData = this.getSimulatedWeather();
        }
    }

    getSimulatedWeather() {
        const conditions = ['맑음', '구름 조금', '흐림', '비'];
        const temps = [15, 18, 22, 25, 28, 20];
        
        return {
            temperature: temps[Math.floor(Math.random() * temps.length)],
            humidity: 50 + Math.floor(Math.random() * 40),
            description: conditions[Math.floor(Math.random() * conditions.length)],
            icon: '01d',
            windSpeed: Math.random() * 10,
            pressure: 1010 + Math.floor(Math.random() * 20),
            visibility: 5 + Math.random() * 10,
            sunrise: new Date(new Date().setHours(6, 0, 0, 0)),
            sunset: new Date(new Date().setHours(18, 30, 0, 0)),
            timestamp: new Date(),
            simulated: true
        };
    }

    getCurrentTime() {
        const now = new Date();
        
        return {
            timestamp: now,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            date: now.getDate(),
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][now.getDay()],
            formatted: {
                date: now.toLocaleDateString('ko-KR'),
                time: now.toLocaleTimeString('ko-KR'),
                datetime: now.toLocaleString('ko-KR'),
                iso: now.toISOString()
            }
        };
    }

    getAllData() {
        return {
            location: this.locationData,
            weather: this.weatherData,
            time: this.getCurrentTime(),
            lastUpdate: new Date()
        };
    }

    notifyCallbacks() {
        const data = this.getAllData();
        this.callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('데이터 콜백 실행 중 오류:', error);
            }
        });
    }

    setLocation(lat, lon, city, country) {
        this.locationData = { lat, lon, city, country };
        this.updateWeather();
        this.notifyCallbacks();
    }

    static formatData(data) {
        const { location, weather, time } = data;
        
        return {
            locationString: location ? `${location.city}, ${location.country}` : '위치 정보 없음',
            weatherString: weather ? `${weather.temperature}°C, ${weather.description}` : '날씨 정보 없음',
            timeString: time ? time.formatted.time : '시간 정보 없음',
            dateString: time ? time.formatted.date : '날짜 정보 없음',
            fullString: `${location?.city || '알 수 없음'} | ${weather?.temperature || '--'}°C | ${time?.formatted.time || '--:--'}`
        };
    }
}

// 싱글톤 인스턴스 생성
const dataProvider = new DataProvider();

// 모듈 내보내기
export default dataProvider;
export { DataProvider };
