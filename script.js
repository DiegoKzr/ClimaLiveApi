const formulario = document.querySelector("#search-form");
const entradaCiudad = document.querySelector("#city-input");
const botonBuscar = document.querySelector("#search-button");
const mensajeEstado = document.querySelector("#status");

const nombreCiudad = document.querySelector("#city-name");
const temperatura = document.querySelector("#temperature");
const condicion = document.querySelector("#condition");
const iconoClima = document.querySelector("#weather-icon");
const viento = document.querySelector("#wind");

// Los códigos vienen de Open-Meteo.
function obtenerDescripcion(codigo, esDeDia) {
  if (codigo === 0) return { texto: "Despejado", icono: esDeDia ? "☀️" : "🌙" };
  if (codigo === 1) return { texto: "Mayormente despejado", icono: esDeDia ? "🌤️" : "🌙" };
  if (codigo === 2) return { texto: "Parcialmente nublado", icono: "⛅" };
  if (codigo === 3) return { texto: "Nublado", icono: "☁️" };
  if (codigo === 45 || codigo === 48) return { texto: "Niebla", icono: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(codigo)) return { texto: "Llovizna", icono: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return { texto: "Lluvia", icono: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(codigo)) return { texto: "Nieve", icono: "❄️" };
  if ([95, 96, 99].includes(codigo)) return { texto: "Tormenta", icono: "⛈️" };

  return { texto: "Sin descripción", icono: "🌡️" };
}

function mostrarEstado(mensaje, hayError = false) {
  mensajeEstado.textContent = mensaje;
  mensajeEstado.classList.toggle("error", hayError);
}

// Primero se busca la ciudad para conocer sus coordenadas.
async function buscarCiudad(ciudad) {
  const parametros = new URLSearchParams({
    name: ciudad,
    count: 1,
    language: "es",
    format: "json"
  });

  const respuesta = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`);

  if (!respuesta.ok) {
    throw new Error("No se pudo buscar la ciudad.");
  }

  const datos = await respuesta.json();

  if (!datos.results || datos.results.length === 0) {
    throw new Error("No se encontró la ciudad. Revisa el nombre.");
  }

  return datos.results[0];
}

// Con las coordenadas se consulta el clima actual.
async function consultarClima(latitud, longitud) {
  const parametros = new URLSearchParams({
    latitude: latitud,
    longitude: longitud,
    current: "temperature_2m,wind_speed_10m,weather_code,is_day",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto"
  });

  const respuesta = await fetch(`https://api.open-meteo.com/v1/forecast?${parametros}`);

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar el clima.");
  }

  const datos = await respuesta.json();

  if (!datos.current) {
    throw new Error("La API no devolvió los datos del clima.");
  }

  return datos.current;
}

// Aquí se muestran los datos que llegaron de la API.
function mostrarClima(ciudad, datosClima) {
  const descripcion = obtenerDescripcion(datosClima.weather_code, datosClima.is_day);

  nombreCiudad.textContent = `${ciudad.name}, ${ciudad.country}`;
  temperatura.textContent = Math.round(datosClima.temperature_2m);
  condicion.textContent = descripcion.texto;
  iconoClima.textContent = descripcion.icono;
  viento.textContent = `${datosClima.wind_speed_10m} km/h`;
}

async function buscarClima(ciudad) {
  if (ciudad.trim() === "") {
    mostrarEstado("Escribe el nombre de una ciudad.", true);
    entradaCiudad.focus();
    return;
  }

  botonBuscar.disabled = true;
  mostrarEstado("Buscando...");

  try {
    const lugar = await buscarCiudad(ciudad.trim());
    const datosClima = await consultarClima(lugar.latitude, lugar.longitude);

    mostrarClima(lugar, datosClima);
    mostrarEstado("Información actualizada.");
  } catch (error) {
    mostrarEstado(error.message, true);
  } finally {
    botonBuscar.disabled = false;
  }
}

formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();
  buscarClima(entradaCiudad.value);
});

// Al iniciar, se muestra el clima de Sincelejo.
buscarClima("Sincelejo");
