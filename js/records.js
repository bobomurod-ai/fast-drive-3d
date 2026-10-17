// Fast Drive 3D - Records & Settings Manager

class RecordsManager {
    constructor() {
        this.highScore = 0;
        this.maxDistance = 0;
        this.maxCoins = 0;
        this.gamesPlayed = 0;
        this.history = []; // Array of { date, score, distance, coins, carName, isRecord }
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem('fastdrive_records');
            if (data) {
                const parsed = JSON.parse(data);
                this.highScore = parsed.highScore || 0;
                this.maxDistance = parsed.maxDistance || 0;
                this.maxCoins = parsed.maxCoins || 0;
                this.gamesPlayed = parsed.gamesPlayed || 0;
                this.history = Array.isArray(parsed.history) ? parsed.history : [];
            }
        } catch (e) {
            console.error("Failed to load records", e);
        }
    }

    save() {
        try {
            localStorage.setItem('fastdrive_records', JSON.stringify({
                highScore: this.highScore,
                maxDistance: this.maxDistance,
                maxCoins: this.maxCoins,
                gamesPlayed: this.gamesPlayed,
                history: this.history
            }));
        } catch (e) {}
    }

    // Record game result and check if new record was set
    submitGame(score, distance, coins, carName) {
        this.gamesPlayed++;
        const isNewRecord = score > this.highScore;

        if (score > this.highScore) this.highScore = score;
        if (distance > this.maxDistance) this.maxDistance = distance;
        if (coins > this.maxCoins) this.maxCoins = coins;

        const recordEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            score: Math.floor(score),
            distance: Math.floor(distance),
            coins: coins,
            carName: carName,
            isRecord: isNewRecord
        };

        this.history.unshift(recordEntry);
        if (this.history.length > 15) {
            this.history.pop();
        }

        this.save();
        return { isNewRecord, entry: recordEntry };
    }

    resetRecords() {
        this.highScore = 0;
        this.maxDistance = 0;
        this.maxCoins = 0;
        this.gamesPlayed = 0;
        this.history = [];
        this.save();
    }
}

class SettingsManager {
    constructor() {
        // Steering types: 'keyboard', 'wheel', 'mouse', 'touchButtons'
        this.steeringType = 'keyboard';
        this.cameraView = 'thirdClose'; // 'thirdFar', 'thirdClose', 'hood'
        this.theme = 'day'; // 'day', 'night'
        this.graphicsQuality = 'high'; // 'high', 'medium'
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem('fastdrive_settings');
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.steeringType) this.steeringType = parsed.steeringType;
                if (parsed.cameraView) this.cameraView = parsed.cameraView;
                if (parsed.theme) this.theme = parsed.theme;
                if (parsed.graphicsQuality) this.graphicsQuality = parsed.graphicsQuality;
            }
        } catch (e) {}
    }

    save() {
        try {
            localStorage.setItem('fastdrive_settings', JSON.stringify({
                steeringType: this.steeringType,
                cameraView: this.cameraView,
                theme: this.theme,
                graphicsQuality: this.graphicsQuality
            }));
        } catch (e) {}
    }

    setSteering(type) {
        this.steeringType = type;
        this.save();
    }

    setCamera(view) {
        this.cameraView = view;
        this.save();
    }

    setTheme(theme) {
        this.theme = theme;
        this.save();
    }
}

window.recordsManager = new RecordsManager();
window.settingsManager = new SettingsManager();
