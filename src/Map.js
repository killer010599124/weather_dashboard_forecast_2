import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { LngLat } from 'mapbox-gl';
import MapBoxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faMapMarkerAlt, faSitemap, faMapLocation, faCalendarAlt, faArrowLeft, faArrowRight, faPlay, faClose, faPause } from '@fortawesome/free-solid-svg-icons';

import axios from 'axios'
import './Map.css';
import columns from './components/forecastTableColumn';
import cityList from './components/defaultCityList';
import WeatherComponent from './components/weatherCard';
import Cookies from "js-cookie"
import * as d3 from 'd3';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Input } from '@mui/material';
import SessionCard from './components/sessionCard';
import { BarChart } from '@mui/x-charts/BarChart';

mapboxgl.accessToken =
  'pk.eyJ1Ijoib2FrdHJlZWFuYWx5dGljcyIsImEiOiJjbGhvdWFzOHQxemYwM2ZzNmQxOW1xZXdtIn0.JPcZgPfkVUutq8t8Z_BaHg';

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const chartRef = useRef(null);
  const isInitialMount = useRef(true);


  const [isLoading, setIsLoading] = useState(true)

  const geocoder = new MapBoxGeocoder({
    // Initialize the geocoder
    accessToken: 'pk.eyJ1Ijoib2FrdHJlZWFuYWx5dGljcyIsImEiOiJjbGhvdWFzOHQxemYwM2ZzNmQxOW1xZXdtIn0.JPcZgPfkVUutq8t8Z_BaHg', // Set the access token
    // localGeocoderOnly: true,
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: true, // Do not use the default marker style
    zoom: 12,
    marker: false,
    placeholder: 'Search locations',

  });

  const [currentLocation, setCurrentLocation] = useState('United states')
  const [radarTile, setRadarTile] = useState(null);
  const [location, setLocation] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const handleLocationChange = (e) => {
    setLocation(e.target.value);

  };
  const handleLocationSelect = () => {
    if (location.trim() !== '') {
      setCurrentLocation(location)
      setSelectedLocations([...selectedLocations, location.trim()]);
      setLocation('');
      setLocationPopupVisible(false)
    }
  };

  const [locationPopupVisible, setLocationPopupVisible] = useState(false)
  const [dailySessionVisible, setDailySessionVisible] = useState(false)

  //---------------------- Weather data display--------------------//

  const [currentCondition, setCurrentCondition] = useState()
  const [todayWeather, setTodayWeather] = useState()
  const [daysWeather, setDaysWeather] = useState()
  const [selectedDayWeather, setSelectedDayWeather] = useState()

  const [todaySession, setTodaySession] = useState([])
  const [selectedDaySession, setSelectedDaySession] = useState()



  //------------ Date Range Setting -------------------------\\
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const nextFifteenDays = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

  const [dateFrom, setDateFrom] = useState(yesterday.toISOString());
  const [dateTo, setDateTo] = useState(nextFifteenDays.toISOString());



  const onChangeDateFrom = (date) => {
    const dateString = changeDateFormat(date)
    setDateFrom(dateString);
  };
  const onChangeDateTo = (date) => {

    const dateString = changeDateFormat(date)
    setDateTo(dateString);
  };


  //-----------Getting Reflectvitiy -----------\\

  const [reflectivityData, setReflectivityData] = useState()

  const getReflectivity = (data) => {
    // Get the current time
    const now = new Date();

    // Extract the reflectivity values and their date/time within the 120 minute range
    const newReflectivityData = [];
    const timeStep = [];
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      if (day.hours != undefined) {
        for (let j = 0; j < day.hours.length; j++) {
          const hour = day.hours[j];
          for (let k = 0; k < hour.minutes.length; k++) {
            const minute = hour.minutes[k];
            const dateTimeStr = `${day.datetime} ${minute.datetime}`;
            const dateTimeObj = new Date(dateTimeStr);
            if (Math.abs(dateTimeObj.getTime() - now.getTime()) <= 7200000) { // 120 minutes
              let reflectivity;
              if (minute.reflectivity == null) reflectivity = 0
              else reflectivity = minute.reflectivity;
              newReflectivityData.push(reflectivity);
              timeStep.push(minute.datetime.slice(0,5))
              // newReflectivityData.push(minute.datetime.slice(0, 5));
            }
          }
        }
      }

    }
    console.log({ data: newReflectivityData, timeStep: timeStep })
    setReflectivityData({ data: newReflectivityData, timeStep: timeStep });
  };


  //-------------------Handle Radar --------------------//
  const [radarTime, setRadarTime] = useState(today)
  const [preRadarTime, setPreRadarTime] = useState(radarTime)
  const [isAuto, setIsAuto] = useState(false)
  let radarInterval;

  const backRadarFrame = () => {
    // console.log("Back : " + radarTime);
    const updateTime = new Date(radarTime.getTime() - 10 * 60 * 1000);
    if (updateTime.getTime() <= new Date().getTime() - 60 * 60 * 1000) {
      // If the updated time is less than or equal to 60 minutes before the current time, stop moving backward
      return;
    }
    setRadarTime(updateTime);
  };

  const forwardRadarFrame = () => {
    // console.log("forward :" + radarTime);
    const updateTime = new Date(radarTime.getTime() + 10 * 60 * 1000);
    if (updateTime.getTime() >= new Date().getTime() + 120 * 60 * 1000) {
      // If the updated time is greater than or equal to 120 minutes after the current time, set the time to 60 minutes after the current time
      const newTime = new Date(new Date().getTime() - 60 * 60 * 1000);
      setRadarTime(newTime);
    } else {
      setRadarTime(updateTime);
    }
  };
  const playRadar = () => {
    // Start the interval to move the radar forward automatically
    setIsAuto(!isAuto)
  };
  useEffect(() => {
    if (isAuto)
      radarInterval = setInterval(() => {
        forwardRadarFrame();
      }, 1000); // Call forwardRadarFrame() every 10 seconds

    return () => clearInterval(radarInterval);
  }, [forwardRadarFrame]);



  //-----------------Date Format Functions ------------------\\

  function changeDateFormat(dateString) {
    // Convert the string to a Date object
    const date = new Date(dateString);
    // Format the date to "YYYY-MM-DD"
    const formattedDate = date.toISOString()
    return formattedDate
  }
  const changeDateFormat_7 = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate
  }

  function convertTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    // Truncate to the nearest 10-minute interval
    minutes = Math.floor(minutes / 10) * 10;

    // If less than half of the interval has passed, subtract another interval
    if (date.getMinutes() - minutes < 5) {
      minutes -= 10;
      if (minutes < 0) {
        minutes = 50;
        hours--;
      }
    }

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    return `${year} ${monthName} ${day} ${formattedHours}${formattedMinutes}`;
  }

  function convertRadarTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = date.getMonth()
    const day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    // Truncate to the nearest 10-minute interval
    minutes = Math.floor(minutes / 10) * 10;

    // If less than half of the interval has passed, subtract another interval
    if (date.getMinutes() - minutes < 5) {
      minutes -= 10;
      if (minutes < 0) {
        minutes = 50;
        hours--;
      }
    }

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}${formattedMonth}${formattedDay}${formattedHours}${formattedMinutes}`;
  }


  //---------------Select Weather Data functions ------------------\\

  function pickTodayWeather(days) {
    const todayIndex = days.findIndex(day => {
      return (day.datetime === today.toISOString().slice(0, 10))
    })
    return days[todayIndex]
  }
  function pickDaysWeather(days) {
    const todayIndex = days.findIndex(day => {
      return (day.datetime === today.toISOString().slice(0, 10))
    })
    const remainingDays = days.filter((_, index) => index !== todayIndex);
    return remainingDays
  }


  function generateHourlyDetailDataFromDayData(dayData) {
    if (dayData != undefined) {
      const timePart = [
        { name: "OverNight", time: 7 },
        { name: "Morning", time: 12 },
        { name: "Afternoon", time: 18 },
        { name: "Evening", time: 24 },
      ];

      const sessionData = [];
      let pretimedate = 0

      for (const timeData of timePart) {

        const data = [];
        const temparray = [];
        const feelsarray = [];
        const preciparray = [];
        if (dayData.hours != undefined) {
          for (let i = pretimedate; i < timeData.time; i++) {
            data.push(dayData.hours[i]);
            temparray.push(dayData.hours[i].temp)
            preciparray.push(dayData.hours[i].precipprob)
            feelsarray.push(dayData.hours[i].feelslike)
          }
          sessionData.push({ name: timeData.name, hours: data, tempmax: Math.max(...temparray), tempmin: Math.min(...temparray), precip: Math.max(...preciparray), feelsMax: Math.max(...feelsarray), feelsMin: Math.min(...feelsarray) });
          pretimedate = timeData.time
        }

      }

      return sessionData;
    }


  }

  useEffect(() => {

    async function fetchWeather() {
      if (dateFrom !== "" && dateTo !== "") {
        const weatherData = JSON.parse(await call_Weather_API(currentLocation));
        setCurrentCondition(weatherData.currentConditions)
        setTodayWeather(pickTodayWeather(weatherData.days))
        setDaysWeather(pickDaysWeather(weatherData.days))
        setTodaySession(generateHourlyDetailDataFromDayData(pickTodayWeather(weatherData.days)))
        getReflectivity(weatherData)
      }
    }

    fetchWeather();

  }, [dateFrom, dateTo, currentLocation]);

  useEffect(() => {
    map_API_Location2Geo(currentLocation)
  }, [currentLocation])

  useEffect(() => {
    if (radarTile != null) {

      mapRef.current.addSource('radar', {
        type: 'raster',
        tiles: ['https://weather1.visualcrossing.com/VisualCrossingWebServices/rest/services/retrievetile/reflectivity/{z}/{x}/{y}/202406041120?key=ZMM2U9XUSJ6UV37L4L49NQACY&model=weatherRadarSubhourly_location&altitude=0&refresh=true&nocache=1715977236564'],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.visualcrossing.comp</a> Visual Crossing'
      });
      mapRef.current.addLayer({
        id: 'custom-tiles',
        type: 'raster',
        source: 'radar',
        'layout': {
          'visibility': 'visible'
        },
        paint: {}
      });
    }
  }, [radarTile])

  useEffect(() => {
    if (mapRef.current != null) {

      console.log(mapRef.current.getLayer('custom-tiles' + convertRadarTimestamp(preRadarTime.toISOString())))

      if (mapRef.current.getLayer('custom-tiles' + convertRadarTimestamp(preRadarTime.toISOString())) != undefined) {

        mapRef.current.removeLayer('custom-tiles' + convertRadarTimestamp(preRadarTime.toISOString()))
        mapRef.current.removeSource('radar' + +convertRadarTimestamp(preRadarTime.toISOString()))
      }

      const tiles = `https://weather1.visualcrossing.com/VisualCrossingWebServices/rest/services/retrievetile/reflectivity/{z}/{x}/{y}/${convertRadarTimestamp(radarTime.toISOString())}?key=ZMM2U9XUSJ6UV37L4L49NQACY&model=weatherRadarSubhourly_location&altitude=0&refresh=true&nocache=1715977236564`

      mapRef.current.addSource('radar' + convertRadarTimestamp(radarTime.toISOString()), {
        type: 'raster',
        tiles: [tiles],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.visualcrossing.comp</a> Visual Crossing'
      });
      mapRef.current.addLayer({
        id: 'custom-tiles' + convertRadarTimestamp(radarTime.toISOString()),
        type: 'raster',
        source: 'radar' + convertRadarTimestamp(radarTime.toISOString()),
        'layout': {
          'visibility': 'visible'
        },
        paint: {}
      });

      setPreRadarTime(radarTime)
    }
  }, [radarTime])
  // Initialize map when component mounts
  useEffect(() => {

    if (isInitialMount.current) {
      // This code will run only on the initial mount
      isInitialMount.current = false;
    } else {

      getRadarTiles()
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-74.0060, 40.7128],
        zoom: 6,

      });
      // Add navigation control (the +/- zoom buttons)
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.doubleClickZoom.disable();
      mapRef.current = map;
      // Clean up on unmount
      return () => map.remove();
    }


  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //---------------Weather Radar Color Bar ------------\\
  const colorBarData = [
    { value: -30, color: 'rgb(119, 86, 167)' },
    { value: -20, color: 'rgb(143, 139, 147)' },
    { value: -10, color: 'rgb(208, 211, 178)' },
    { value: 0, color: 'rgb(64, 97, 159)' },
    { value: 10, color: 'rgb(62, 209, 136)' },
    { value: 20, color: 'rgb(37, 151, 0)' },
    { value: 30, color: 'rgb(238, 207, 0)' },
    { value: 40, color: 'rgb(254, 134, 0)' },
    { value: 50, color: 'rgb(247, 0, 0)' },
    { value: 60, color: 'rgb(255, 201, 255)' },
    { value: 70, color: 'rgb(255, 2, 230)' },
    { value: 80, color: 'rgb(112, 0, 224)' }
  ];

  //--------------API_Call-----------
  async function call_Weather_API(location) {
    const currentTime = new Date().toISOString();
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${dateFrom}/${dateTo}?key=3C8TRCWYPKSPU83H6U8CJ5CUR&unitGroup=metric&elements=%2Baqius,%2Breflectivity,%2Baqielement,%2Buvindex2,%2Bprecipremote,%2Breflectivity2&include=days,hours,minutes,current,alerts,obs,fcst,stats&options=subhourlyfcst`,
      // url : "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/36.7591,-95.3833/2024-05-24/2024-05-31?key=3C8TRCWYPKSPU83H6U8CJ5CUR&unitGroup=metric&elements=%2Breflectivity&include=minutes,current&options=subhourlyfcst&iconSet=icons2",
      headers: {}
    };

    try {
      const response = await axios.request(config);
      const str = JSON.stringify(response.data);
      return str;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async function getRadarTiles() {
    const currentTime = new Date().toISOString();
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://weather1.visualcrossing.com/VisualCrossingWebServices/rest/services/retrievetile/reflectivity/6/13/25/202405172220?key=ZMM2U9XUSJ6UV37L4L49NQACY&model=weatherRadarSubhourly_location&altitude=0&refresh=true&nocache=1715977236564`,
      // url : "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/36.7591,-95.3833/2024-05-24/2024-05-31?key=3C8TRCWYPKSPU83H6U8CJ5CUR&unitGroup=metric&elements=%2Breflectivity&include=minutes,current&options=subhourlyfcst&iconSet=icons2",
      headers: {}
    };

    try {
      const response = await axios.request(config);
      console.log(response)
      setRadarTile(response)
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async function map_API_Geo2Location(lng, lat) {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=pk.eyJ1Ijoib2FrdHJlZWFuYWx5dGljcyIsImEiOiJjbGhvdWFzOHQxemYwM2ZzNmQxOW1xZXdtIn0.JPcZgPfkVUutq8t8Z_BaHg`,
      headers: {}
    };

    try {
      const response = await axios.request(config);
      if (response.data.features.length !== 0) {
        const str = response.data.features[0].properties.full_address.toString();
        // setLocations((prevLocations) => [...prevLocations, str]);
        return str;
      }
    } catch (error) {
      console.log(error);
      return null
    }
  }

  async function map_API_Location2Geo(location) {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.mapbox.com/search/geocode/v6/forward?q=${location}&access_token=pk.eyJ1Ijoib2FrdHJlZWFuYWx5dGljcyIsImEiOiJjbGhvdWFzOHQxemYwM2ZzNmQxOW1xZXdtIn0.JPcZgPfkVUutq8t8Z_BaHg`,
      headers: {}
    };

    try {
      const response = await axios.request(config);
      if (response.data.features.length !== 0) {
        const str = JSON.stringify(response.data.features[0].geometry.coordinates);
        mapRef.current.flyTo({
          center: response.data.features[0].geometry.coordinates,
          essential: true // this animation is considered essential with respect to prefers-reduced-motion
        });
        // setLocations((prevLocations) => [...prevLocations, str]);
        return str;
      }
    } catch (error) {
      console.log(error);
      return null
    }
  }


  return (
    <div>

      <div className='locationName' style={{ cursor: 'pointer' }} onClick={() => {
        setLocationPopupVisible(!locationPopupVisible)
      }}>
        {currentLocation}

        <FontAwesomeIcon icon={faMapLocation} style={{ marginLeft: '5px' }} />
      </div>
      <div className='location-selection-container' style={{ display: locationPopupVisible ? "unset" : 'none' }}>
        <div className="location-input-container">
          <h3 style={{ color: 'white', }}>Enter a Location</h3>
          <div className="location-input-group" style={{ marginTop: '5px' }}>

            <input
              type="text"
              className="location-input"
              placeholder="Enter a location"
              value={location}
              onChange={handleLocationChange}
            />
            <button className="location-select-button" onClick={handleLocationSelect}>
              Select
            </button>
          </div>
          <h3 style={{ color: 'white', borderBottom: '1px solid white' }}>History:</h3>
          {selectedLocations.length > 0 && (
            <div className="selected-locations-container">

              <ul className="selected-locations-list">
                {selectedLocations.map((loc, index) => (
                  <li key={index} className="selected-location-item" onClick={() => {
                    setCurrentLocation(loc)
                    setLocationPopupVisible(false)
                  }}>
                    {loc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className='DateSideBar'>
        <div className='date'>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '5px' }} />
          <DatePicker
            selected={dateFrom}
            onChange={onChangeDateFrom}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select a date"
          />
          <span> ~~ </span>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '5px' }} />
          <DatePicker
            selected={dateTo}
            onChange={onChangeDateTo}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select a date"
          />
        </div>
        <ul className='dateRange'>
          {daysWeather != undefined ? daysWeather.map((item, index) => (
            <li key={index} ><div className="daily_summary" onClick={() => {
              setSelectedDayWeather(item)
              setDailySessionVisible(true)
              setSelectedDaySession(generateHourlyDetailDataFromDayData(item))
            }}>
              <div className='currentCard_icon'>
                <img // Adjust the desired width and height values
                  style={{ width: '30px', height: '30px' }}
                  src={`../icons/${item != undefined ? item.icon : ""}.svg`}
                  alt="Weather"
                />
                <div style={{ color: 'black' }}>
                  {item != undefined ? changeDateFormat_7(item.datetime) : ""}
                </div>
              </div>
              <div className='todayCard_properties'>
                <div>
                  {item != undefined ? item.description : ""}
                </div>
                <div className='currentCard_properties' style={{ width: '100%' }}>
                  <span><div>High</div><div>{item != undefined ? item.tempmax : ""}℃</div></span>
                  <span><div>Low</div><div>{item != undefined ? item.tempmin : ""}℃</div></span>
                  <span><div>Precip</div><div>{item != undefined ? item.precipprob : ""}%,{item != undefined ? item.precip : ""}mm</div></span>
                  <span><div>UVI</div><div>{item != undefined ? item.uvindex : ""}</div></span>
                </div>

              </div>
            </div></li>
          )) : ""}
        </ul>
      </div>

      {dailySessionVisible ? <div className='dailyDetailPopup' >
        <div className='todayCard' style={{ width: '100%', height: '100%', opacity: 1 }}>
          <div style={{ color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {selectedDayWeather != undefined ? changeDateFormat_7(selectedDayWeather.datetime) : ""}
            <FontAwesomeIcon className='radar-frame-icon' icon={faClose} style={{ color: "black", cursor: 'pointer' }} onClick={() => { setDailySessionVisible(false) }} />
          </div>
          <div className="todayCard_summary" style={{ fontWeight: 'bold' }} >
            <div className='currentCard_icon'>
              <img // Adjust the desired width and height values

                src={`../icons/${selectedDayWeather != undefined ? selectedDayWeather.icon : ""}.svg`}
                alt="Weather"
              />

            </div>
            <div className='todayCard_properties' style={{ height: "100%" }}>
              <div>
                {selectedDayWeather != undefined ? selectedDayWeather.description : ""}
              </div>
              <div className='currentCard_properties' style={{ width: '100%' }}>
                <span><div>High</div><div>{selectedDayWeather != undefined ? selectedDayWeather.tempmax : ""}℃</div></span>
                <span><div>Low</div><div>{selectedDayWeather != undefined ? selectedDayWeather.tempmin : ""}℃</div></span>
                <span><div>Precip</div><div>{selectedDayWeather != undefined ? selectedDayWeather.precipprob : ""}%,{selectedDayWeather != undefined ? selectedDayWeather.precip : ""}mm</div></span>
                <span><div>AQI</div><div>{selectedDayWeather != undefined ? selectedDayWeather.aquis : ""}</div></span>
                <span><div>UVI</div><div>{selectedDayWeather != undefined ? selectedDayWeather.uvindex : ""}</div></span>
              </div>
              <div className='currentCard_properties' style={{ width: '100%' }}>
                <span><div>Wind</div><div>{selectedDayWeather != undefined ? selectedDayWeather.windspeed : ""},{selectedDayWeather != undefined ? selectedDayWeather.winddir : ""}mb</div></span>
                <span><div>Humidity</div><div>{selectedDayWeather != undefined ? selectedDayWeather.humidity : ""}%</div></span>
                <span><div>Sunrise/set</div><div>{selectedDayWeather != undefined ? (selectedDayWeather.sunrise) : ""}</div><div>{selectedDayWeather != undefined ? selectedDayWeather.sunset : ""}</div></span>
              </div>
            </div>
          </div>
          <div className='todayCard_details' style={{ height: "100%" }}>
            {selectedDaySession != undefined ? selectedDaySession.map((data, index) => (
              <SessionCard
                key={index}
                sessionData={data}
                style={{ background: 'aqua' }}
              />
            )) : ""}
          </div>

        </div>
      </div> : ""}



      <div className='TodaySideBar'>

        <div className='date'>
          Currently
        </div>
        <div className="currentCard" >
          <div className='currentCard_icon'>
            <img // Adjust the desired width and height values
              style={{ width: '50px', height: '50px' }}
              src={`../icons/${currentCondition != undefined ? currentCondition.icon : ""}.svg`}
              alt="Weather"
            />
            <div style={{ color: 'black' }}>
              {currentCondition != undefined ? currentCondition.datetime : ""}
            </div>
          </div>
          <div className='currentCard_properties' style={{ width: '85%' }}>
            <span> {currentCondition != undefined ? currentCondition.temp : ""}</span>
            <span><div>UVI</div><div> {currentCondition != undefined ? currentCondition.uvindex : ""}</div></span>
            <span><div>AQI</div><div> {currentCondition != undefined ? currentCondition.aqius : ""}</div></span>
            <span><div>Wind</div><div> {currentCondition != undefined ? currentCondition.windspeed : ""}</div></span>
          </div>
        </div>
        <div className='todayCard'>
          <div style={{ color: 'black' }}>
            Today
          </div>
          <div className="todayCard_summary" >
            <div className='currentCard_icon'>
              <img // Adjust the desired width and height values
                style={{ width: '50px', height: '50px' }}
                src={`../icons/${todayWeather != undefined ? todayWeather.icon : ""}.svg`}
                alt="Weather"
              />
              <div style={{ color: 'black' }}>
                {todayWeather != undefined ? changeDateFormat_7(todayWeather.datetime) : ""}
              </div>
            </div>
            <div className='todayCard_properties'>
              <div>
                {todayWeather != undefined ? todayWeather.description : ""}
              </div>
              <div className='currentCard_properties' style={{ width: '100%' }}>
                <span><div>High</div><div>{todayWeather != undefined ? todayWeather.tempmax : ""}℃</div></span>
                <span><div>Low</div><div>{todayWeather != undefined ? todayWeather.tempmin : ""}℃</div></span>
                <span><div>Precip</div><div>{todayWeather != undefined ? todayWeather.precipprob : ""}%,{todayWeather != undefined ? todayWeather.precip : ""}mm</div></span>
                <span><div>AQI</div><div>{todayWeather != undefined ? todayWeather.aquis : ""}</div></span>
                <span><div>UVI</div><div>{todayWeather != undefined ? todayWeather.uvindex : ""}</div></span>
              </div>
              <div className='currentCard_properties' style={{ width: '100%' }}>
                <span><div>Wind</div><div>{todayWeather != undefined ? todayWeather.windspeed : ""},{todayWeather != undefined ? todayWeather.winddir : ""}mb</div></span>
                <span><div>Humidity</div><div>{todayWeather != undefined ? todayWeather.humidity : ""}%</div></span>
                <span><div>Sunrise/set</div><div>{todayWeather != undefined ? (todayWeather.sunrise) : ""}</div><div>{todayWeather != undefined ? todayWeather.sunset : ""}</div></span>
              </div>
            </div>
          </div>
          <div className='todayCard_details'>
            {todaySession.map((data, index) => (
              <SessionCard
                key={index}
                sessionData={data}
              />
            ))}
          </div>

        </div>

      </div>

      <div className="color-bar-container">
        {colorBarData.map((item, index) => (
          <div
            key={index}
            className="color-bar-item"
            style={{ backgroundColor: item.color }}
          >
            {item.value}
          </div>
        ))}
      </div>

      <div className="unit-container">
        <div className='unit-item' style={{ background: 'teal' }}>F</div>
        <div className='unit-item'>C</div>
      </div>

      <div className="radar-frame-container">
        <FontAwesomeIcon className='radar-frame-icon' icon={faArrowLeft} onClick={backRadarFrame} />
        <div >
          <div style={{ color: 'white', textAlign: 'center' }}>{convertTimestamp(radarTime.toISOString()).slice(11, 15)}</div>
          <div style={{ color: 'white' }}>{convertTimestamp(radarTime.toISOString()).slice(0, 10)}</div>
        </div>

        <FontAwesomeIcon className='radar-frame-icon' icon={faArrowRight} onClick={forwardRadarFrame} />
        <FontAwesomeIcon className='radar-frame-icon' icon={isAuto ? faPause : faPlay} onClick={playRadar} />
      </div>
      <div className='rain-frame-container' >
        <div style={{ position: "absolute", top: 1, left: 5, color: 'white' }}>Rain Nearby</div>
        {reflectivityData ?
          <BarChart
            series={[
              { data: reflectivityData.data }
            ]}
            height={150}
            xAxis={[{ data: reflectivityData.timeStep, scaleType: 'band' }]}
            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
            sx={{
              //change left yAxis label styles
              "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel": {
                strokeWidth: "0.4",
                fill: "#ffffff"
              },
              // change all labels fontFamily shown on both xAxis and yAxis
              "& .MuiChartsAxis-tickContainer .MuiChartsAxis-tickLabel": {
                fontFamily: "Roboto",
              },
              // change bottom label styles
              "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": {
                strokeWidth: "0.5",
                fill: "#FFFFFF"
              },
              // bottomAxis Line Styles
              "& .MuiChartsAxis-bottom .MuiChartsAxis-line": {
                stroke: "#FFFFFF",
                strokeWidth: 0.4
              },
              // leftAxis Line Styles
              "& .MuiChartsAxis-left .MuiChartsAxis-line": {
                stroke: "#FFFFFF",
                strokeWidth: 0.4
              }
            }}
          /> : ""}

      </div>
      <div className='map-container' ref={mapContainerRef} />
    </div>
  );
};

export default Map;
