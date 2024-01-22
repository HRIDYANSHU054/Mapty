'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Implementing the Architecture
////////////////////////////////////
//Class WorkOut
class Workout {
    date = new Date();
    id = (new Date() + "").slice(-10) ;
    click = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.duration =duration;
        this.distance = distance;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.desription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${ months[this.date.getMonth()]} ${this.date.getDate()}`;

    }

    click() {
        this.click++;
    }
}

//Class Running
class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration) ;
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = this. distance / this.duration ;
        return this.pace ;
    }
}

//Class Cycling
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration) ;
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / ( this.duration/ 60 );
        return this.speed;
    }
}


////////////////////////////////////
//Class App
class App {
    //these are private instance fields (they will be created for every object of this class)
    #map;
    #mapEve;
    #zoomLvl = 13;
    #workouts = [];

    constructor(){
        //Get user's position
        this._getPosition();

        //Get Data from local storage
        this._getLocalStorage() ;

        //Attach event handlers
        form.addEventListener("submit",  this._newWorkout.bind(this)) ;
        //whenever the select field value changes the "change" Event is triggered
        inputType.addEventListener("change",  this._toggleElevationField ) ;
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)) ;
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition( 
                this._loadMap.bind(this)  , 
                () => {
                alert("Could not get user's coordinates");
                }
            ) ;
    }

    _loadMap(pos) {
            const {latitude} = pos.coords;
            const {longitude} = pos.coords; 
            const coords = [latitude, longitude] ;

            this.#map = L.map('map').setView( coords, this.#zoomLvl);
            // here 'map' is the id of the element in which will display the map
            // the 13 is the zoom scale number

            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map); 

            // these are not js events but are provided by Leaflet
            //for Handling map clicks
            this.#map.on( 'click', this._showForm.bind(this) )

            this.#workouts.forEach( work => this._renderWorkoutMarker(work) ) ;

            
    }

    _showForm( mapE ) {
        this.#mapEve = mapE ;
        form.classList.remove('hidden') ;
        inputDistance.focus() ;
    }

    _hideForm() {
        //Empty Fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        form.style.display = "none" ;
        form.classList.add('hidden');
        setTimeout( () => {
            form.style.display = "grid" ;
        } , 1000 ) ;
    }

    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden') ;
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden') ;
    }

    _newWorkout(eve) {
        //helper function to check whether all the inputs were finite or not
        const validInputs = (...inputs) => 
        inputs.every( inp => Number.isFinite(inp) ) ;
        const allPositives = (...inputs) =>
        inputs.every( inp => inp > 0) ;

        eve.preventDefault();

        //Get data from form
        const type = inputType.value ;
        //the unary + way of converting strings to number
        const duration =  +inputDuration.value;
        const distance = +inputDistance.value;
        const {lat, lng} = this.#mapEve.latlng ;
        let workout;

        //If workOut running, create running object
        if(type === 'running') {
            // Check if data is valid
            const cadence = +inputCadence.value;
            if( 
                !validInputs(distance, duration, cadence) ||
                !allPositives(distance, duration, cadence)
            ) return alert("inputs should be positive numbers") ; //Guard Clause

            workout = new Running( [lat,lng], distance, duration, cadence );
            
        }
        //If workOut cycling, create cycling object
        if(type === 'cycling') {
            // Check if data is valid
            const elevation = +inputElevation.value;
            if( 
                !validInputs(distance, duration, elevation) ||
                !allPositives(distance, duration)  ||
                elevation < 0
            ) return alert("inputs should be positive numbers") ; //Guard Clause

            workout = new Cycling([lat, lng], distance, duration, elevation) ;
        }
        //Add new object to workout array
        this.#workouts.push(workout) ;

        //Render workout on map as marker
         this._renderWorkoutMarker(workout) ;   

        //Render workout on list
        this._renderWorkout(workout) ;

        //Hide form + clear input fields 
        this._hideForm();

        //Set local Storage to all workouts
        this._setLocalStorage();
           
    }

    _renderWorkoutMarker(workout) {
        //Displaying the marker 
        L.marker( workout.coords ).addTo(this.#map)
        .bindPopup(L.popup(
            {
                autoClose: false,
                maxWidth: 250,
                minWidth: 100,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }
        ))
        .setPopupContent(`${workout.type === 'running' ?'🏃‍♂️':'🚴‍♂️'} ${workout.desription}`)
        .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.desription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ?'🏃‍♂️':'🚴‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if(workout.type === 'running') {
            html+= `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
            </li>
            `;
        }
        if(workout.type === 'cycling') {
            html+= `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
              </div>
            </li>
            `;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return; //Guard clause

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id) ;

        //going to the position in the map
        //firsr arg is the coordinates and second is the zoom level , third is an object of options

        this.#map.setView( workout.coords, this.#zoomLvl, 
            {  
                animate: true,
                pan: {
                    duration: 1,
                } ,
            }    
        );

        //using the Public Interface
        workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem( 'workouts', JSON.stringify(this.#workouts) ) ;
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts") ); 

        if(!data) return;

        this.#workouts = data; 

        this.#workouts.forEach( work => this._renderWorkout(work) ) ;
    }

    reset() {
        localStorage.removeItem("workout") ;
        location.reload() ;
    }
}

const app = new App();





