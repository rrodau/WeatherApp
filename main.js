import { ICON_MAP } from "./iconMap";
import "./style.css"
import { getWeather } from "./weather"
import axios from "axios"
import Plotly from 'plotly.js-dist'


const weekday = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const d = new Date();
const today = weekday[d.getDay()];
const yTempHourly = [];
const yTempFeelsLikeHourly = [];
const yWindSpeedHourly = [];
const xTime = [];
navigator.geolocation.getCurrentPosition(positionSuccess, positionError);

function positionSuccess({ coords }) {
  //getCity(coords.latitude, coords.longitude);
  getWeather(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
    .then(renderWeather)
    .catch(e => {
      console.error(e);
      alert("Error getting weather.")
    });
}

function positionError() {
  alert("There was an error getting your location. Please allow us to use your location and refresh the page.")
}


function getCity(lat, long) {
  const response = axios.get(`https://www.latlong.net/c/?lat=${lat}&long=${long}`)
    .then(({ response }) => {
      const parser = new DOMParser;
      const doc = parser.parseFromString(response, "text/html");
      const input = doc.querySelector("#address")
      console.log(input);
    })
    .catch(e => {
      console.log(e);
    })
}

function renderWeather({ current, daily, hourly }) {
  renderCurrentWeather(current);
  renderDailyWeather(daily);
  renderHourlyWeather(hourly);
  //plotData();
  document.body.classList.remove("blurred");
}

function setValue(selector, value, { parent = document } = {}) {
  parent.querySelector(`[data-${selector}]`).textContent = value
}

function getIconUrl(iconCode) {
  return `icons/${ICON_MAP.get(iconCode)}.svg`;
}

const currentIcon = document.querySelector("[data-current-icon]")
function renderCurrentWeather(current) {
  currentIcon.src = getIconUrl(current.iconCode)
  setValue("current-temp", current.currentTemp);
  setValue("current-high", current.highTemp);
  setValue("current-low", current.lowTemp);
  setValue("current-fl-high", current.highFeelsLike);
  setValue("current-fl-low", current.lowFeelsLike);
  setValue("current-wind", current.windSpeed);
  setValue("current-precip", current.precip);
}

const DAY_FROMATTER = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const dailySection = document.querySelector("[data-day-section]");
const dayCardTemplate = document.getElementById("day-card-template");
function renderDailyWeather(daily) {
  dailySection.innerHTML = ""
  daily.forEach(day => {
    const element = dayCardTemplate.content.cloneNode(true);
    setValue("temp", day.maxTemp, { parent: element });
    setValue("date", DAY_FROMATTER.format(day.timestamp), { parent: element });
    element.querySelector("[data-icon]").src = getIconUrl(day.iconCode);
    dailySection.append(element);
  })
}

const HOUR_FROMATTER = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
const hourlySection = document.querySelector("[data-hour-section]");
const hourRowTemplate = document.getElementById("hour-row-template");
function renderHourlyWeather(hourly) {
  hourlySection.innerHTML = ""
  hourly.forEach(hour => {
    const element = hourRowTemplate.content.cloneNode(true);
    setValue("temp", hour.temp, { parent: element });
    setValue("fl-temp", hour.feelsLike, { parent: element });
    setValue("wind", hour.windSpeed, { parent: element });
    setValue("precip", hour.precip, { parent: element });
    setValue("day", DAY_FROMATTER.format(hour.timestamp), { parent: element });
    setValue("time", HOUR_FROMATTER.format(hour.timestamp), { parent: element });
    element.querySelector("[data-icon]").src = getIconUrl(hour.iconCode);
    hourlySection.append(element);
    console.log(typeof hour.temp);
    if (today === DAY_FROMATTER.format(hour.timestamp)) {
      yTempHourly.push(hour.temp);
      yTempFeelsLikeHourly.push(hour.feelsLike);
      xTime.push(HOUR_FROMATTER.format(hour.timestamp));
    }
  })
}

function plotData() {
  const temperaturePlot = {
    x: xTime,
    y: yTempHourly,
    type: 'scatter',
    name: "Temperatur"
  };

  const temperatureFeelsLikePlot = {
    x: xTime,
    y: yTempFeelsLikeHourly,
    type: 'scatter',
    name: "Gefühlte Temperatur"
  };

  const layout = {
    width: 1600,
    height: 800,
    title: {
      text: 'Temperatur über den Tag',
      font: {color: 'white'}
    },

    xaxis: {
      title: {
        text: 'Uhrzeit',
        font: { color: 'white'}
      }
    },

    yaxis: {
      title: {
        text: 'Temperatur in Grad Celcius',
        font: { color: 'white'}
      }
    },

    legend: {
      font: { color: 'white'}
    },
    plot_bgcolor : '#323232',
    paper_bgcolor: '#171717',
  }
  const data = [temperaturePlot, temperatureFeelsLikePlot];
  const myDiv = document.getElementById('plot');
  Plotly.newPlot(myDiv, data, layout);
}