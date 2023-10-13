'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//const coords = [28.432122,77.06003];


// WORKOUT CLASS
class Workout{
    constructor(distance,duration,coords){
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
        this.id = this.generateNewID();
        this.date = new Date();
    }
    generateNewID(){
        let uuid = Math.random().toString(36).slice(2, 30);
        return uuid;
    }
}

// CYCLING CLASS
class Cycling extends Workout{
    type = "cycling";
    constructor(distance,duration,coords,elevationGain){
        super(distance,duration,coords);
        this.elevationGain = elevationGain;
        this.speed = this.distance / (this.duration / 60);
    }
}

// RUNNING CLASS
class Running extends Workout{
    type = "running";
    constructor(distance,duration,coords,cadence){
        super(distance,duration,coords);
        this.cadence = cadence;
        this.pace = this.duration / this.distance;
    }

}

// APPLICATION CLASS
class App{
    #map;
    #mapEvent;
    #workoutList = [];
    constructor(){
        try{
            this.#getPosition();
            form.addEventListener('submit',this.#newWorkout.bind(this));
            inputType.addEventListener('change',this.#toggleElevationField.bind(this));
        }catch(error){
            console.log(error);
        }
    }

    #getPosition(){
        if("geolocation" in navigator){
            navigator.geolocation.getCurrentPosition(this.#loadMap.bind(this),
            function(){
                throw new Error("Location need to be enabled in browser!!")
            });
        }else{
            throw new Error("Geolocation property not found in navigator");
        }
    }

    #loadMap(position){
        const mapCoord = [position.coords.latitude, position.coords.longitude];
        this.#map = L.map('map').setView(mapCoord, 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'})
            .addTo(this.#map);
    
        L.marker(mapCoord)
        .addTo(this.#map);

        this.#map.on("click",this.#showForm.bind(this))

    }

    #showForm(mapEvnt){
        this.#mapEvent = mapEvnt;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    #toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    validNumber(...arr){
        return arr.every(function(item){
            let regex = /^[-+]?\d*\.?\d+$/;
            return item.match(regex);
        })
    }

    positiveNumber(...arr){
        return arr.every(function(item){
            return (item > 0);
        })
    }

    #renderWorkoutMarker(workoutObj){
        L.marker(workoutObj.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 100,
                autoClose: false,
                closeOnEscapeKey: false,
                closeOnClick: false,
                className: workoutObj.type + "-popup"
            })
        )
        .setPopupContent(workoutObj.type)
        .openPopup();
    }

    #hideForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        form.classList.add("hidden");
    }

    #newWorkout(submitEvent){
        submitEvent.preventDefault();

        const {lat,lng} = this.#mapEvent.latlng;
        // Get data from form
        const type = inputType.value;
        let distance = inputDistance.value;
        let duration = inputDuration.value;
        
        let workoutObj;
        // if workout is running, create Running object
        if(type === "running"){
            let cadence = inputCadence.value;
            // check if data is valid
            if(!this.validNumber(distance, duration, cadence) || !this.positiveNumber(distance, duration, cadence))
            {
                return alert("Invalid Input provided!!");
            }
            distance = Number(distance);
            duration = Number(duration);
            cadence = Number(cadence);
            workoutObj = new Running(distance, duration,[lat,lng], cadence);
        }

        // if workout is cycling, create Cycling object
        if(type === "cycling"){
            let elevation = inputElevation.value;
            // check if data is valid
            if(!this.validNumber(distance,duration,elevation) || !this.positiveNumber(distance,duration))
            {
                return alert("Invalid Input provided!!");
            }
            distance = Number(distance);
            duration = Number(duration);
            elevation = Number(elevation);
            workoutObj = new Cycling(distance,duration,[lat,lng],elevation);
        }

        // Add object to workout array
        this.#workoutList.push(workoutObj);

        // Render object on map as marker
        this.#renderWorkoutMarker(workoutObj);

        // Render workout on list item
        this._renderWorkout(workoutObj);
        
        // SAVE IN LOCAL STORAGE <<TO DO>>
        const workOutListJSON = JSON.stringify(this.#workoutList);
        localStorage.setItem("workoutData", workOutListJSON);
        // console.log(localStorage.getItem("workoutData"));

        // Clear input and Hide Form
        this.#hideForm();
    }
    
    #renderRunning(workout){
        const newListItem = document.createElement('li');
        newListItem.className = `workout workout--${workout.type}`;
        newListItem.setAttribute('data-id', workout.id);
        newListItem.innerHTML = `<h2 class="workout__title">Running on ${workout.date.toLocaleString('en-US', {month: 'long'})} ${workout.date.getDate()}</h2>
        <div class="workout__details">
          <span class="workout__icon">🏃‍♂️</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>`;
        containerWorkouts.appendChild(newListItem);
    }

    #renderCycling(workout){
        const newListItem = document.createElement('li');
        newListItem.className = `workout workout--${workout.type}`;
        newListItem.setAttribute('data-id', workout.id);
        newListItem.innerHTML = `<h2 class="workout__title">Cycling on ${workout.date.toLocaleString('en-US', {month: 'long'})} ${workout.date.getDate()}</h2>
        <div class="workout__details">
          <span class="workout__icon">🚴‍♀️</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>`;
        containerWorkouts.appendChild(newListItem);
    }


    _renderWorkout(workout){
        if(workout.type === 'running'){
            this.#renderRunning(workout)
        }
        if(workout.type === 'cycling'){
            this.#renderCycling(workout);
        }
    }
}

new App();


