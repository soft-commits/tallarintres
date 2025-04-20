// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBBFsh0Gmdspojuw_9vNgqIl2_HdMdZr1A",
    authDomain: "controlasistenciaapp-3ccbb.firebaseapp.com",
    databaseURL: "https://controlasistenciaapp-3ccbb-default-rtdb.firebaseio.com",
    projectId: "controlasistenciaapp-3ccbb",
    storageBucket: "controlasistenciaapp-3ccbb.firebasestorage.app",
    messagingSenderId: "714929193243",
    appId: "1:714929193243:web:d70673e24e8aecd80753be"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  const tabla = document.getElementById("tabla-asistencia");
  const inputFecha = document.getElementById("filtroFecha");
  const selectAlumno = document.getElementById("filtroAlumno");
  const btnExportar = document.getElementById("btnExportar");
  const btnHistorial = document.getElementById("btnHistorial");
  const btnFiltrado = document.getElementById("btnFiltrado");
  const ctx = document.getElementById("graficoAsistencia").getContext("2d");
  
  const aulaLat = -12.0023712;
  const aulaLon = -77.0626758;
  const radioPermitido = 0.0002;
  
  let chart;
  
  // Cargar select de alumnos
  function cargarOpcionesAlumnos() {
    db.ref("asistencias").once("value", (snapshot) => {
      const data = snapshot.val();
      const codigos = new Set();
  
      for (let codigo in data) {
        codigos.add(codigo);
      }
  
      selectAlumno.innerHTML = '<option value="">-- Ver todos los alumnos --</option>';
      codigos.forEach(codigo => {
        const option = document.createElement("option");
        option.value = codigo;
        option.textContent = codigo;
        selectAlumno.appendChild(option);
      });
    });
  }
  
  // Calcular distancia
  function calcularDistancia(lat1, lon1, lat2, lon2) {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
  }
  
  // Mostrar datos
  function mostrarDatos(filtroFecha = null, modo = "filtrado", filtroAlumno = "") {
    db.ref("asistencias").once("value", (snapshot) => {
      tabla.innerHTML = "";
      const data = snapshot.val();
      const contadorAsistencias = {};
  
      for (let codigo in data) {
        const asistencias = data[codigo];
  
        for (let timestamp in asistencias) {
          const info = asistencias[timestamp];
          const fechaRegistro = info.fecha || "";
  
          const incluirEsteRegistro =
            (modo === "historial" || (modo === "filtrado" && fechaRegistro === filtroFecha)) &&
            (filtroAlumno === "" || codigo === filtroAlumno);
  
          if (incluirEsteRegistro) {
            const distancia = calcularDistancia(
              parseFloat(info.latitud),
              parseFloat(info.longitud),
              aulaLat,
              aulaLon
            );
  
            const presente = distancia <= radioPermitido;
            const estado = presente ? "Presente" : "Ausente";
  
            if (modo !== "historial") {
              const fila = `
                <tr>
                  <td>${info.nombre || ""}</td>
                  <td>${info.apellido || ""}</td>
                  <td>${info.codigo || codigo}</td>
                  <td>${info.facultad || ""}</td>
                  <td>${info.especialidad || ""}</td>
                  <td>${info.fecha || ""}</td>
                  <td>${info.hora || ""}</td>
                  <td><strong>${estado}</strong></td>
                </tr>
              `;
              tabla.innerHTML += fila;
            }
  
            if (presente) {
              const clave = info.codigo || codigo;
              contadorAsistencias[clave] = (contadorAsistencias[clave] || 0) + 1;
            }
          }
        }
      }
  
      actualizarGrafico(contadorAsistencias);
      mostrarResumen(contadorAsistencias);
    });
  }
  
  // Gráfico
  function actualizarGrafico(data) {
    const labels = Object.keys(data);
    const valores = Object.values(data);
  
    if (chart) chart.destroy();
  
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Asistencias",
          data: valores,
          backgroundColor: "#0d6efd"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Gráfico de asistencia por estudiante" }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  // Resumen
  function mostrarResumen(data) {
    const totalEstudiantes = Object.keys(data).length;
    const asistencias = Object.values(data);
  
    if (totalEstudiantes === 0) {
      document.getElementById("resumenTexto").textContent = "No hay registros disponibles.";
      return;
    }
  
    const suma = asistencias.reduce((a, b) => a + b, 0);
    const promedio = (suma / totalEstudiantes).toFixed(2);
  
    const minAsistencias = Math.min(...asistencias);
    const estudiantesMin = [];
  
    for (let codigo in data) {
      if (data[codigo] === minAsistencias) {
        estudiantesMin.push(codigo);
      }
    }
  
    const textoResumen = `
      👥 Total de estudiantes: ${totalEstudiantes}  
      📉 Estudiante(s) con menor asistencia (${minAsistencias}): ${estudiantesMin.join(", ")}  
      📊 Promedio general: ${promedio} asistencias
    `;
  
    document.getElementById("resumenTexto").textContent = textoResumen;
  }
  
  // Inicialización
  mostrarDatos(inputFecha.value, "filtrado");
  cargarOpcionesAlumnos();
  
  // Eventos
  inputFecha.addEventListener("change", () => {
    const fechaSeleccionada = inputFecha.value;
    const alumnoSeleccionado = selectAlumno.value;
    mostrarDatos(fechaSeleccionada, "filtrado", alumnoSeleccionado);
  });
  
  selectAlumno.addEventListener("change", () => {
    const fechaSeleccionada = inputFecha.value;
    const alumnoSeleccionado = selectAlumno.value;
    mostrarDatos(fechaSeleccionada, "filtrado", alumnoSeleccionado);
  });
  
  btnExportar.addEventListener("click", () => {
    const tablaHTML = document.getElementById("tabla-asistencia");
    const wb = XLSX.utils.table_to_book(tablaHTML, { sheet: "Asistencia" });
    XLSX.writeFile(wb, "Asistencia_" + new Date().toISOString().slice(0, 10) + ".xlsx");
  });
  
  btnHistorial.addEventListener("click", () => {
    const alumnoSeleccionado = selectAlumno.value;
    mostrarDatos(null, "historial", alumnoSeleccionado);
  });
  
  btnFiltrado.addEventListener("click", () => {
    const fechaSeleccionada = inputFecha.value;
    const alumnoSeleccionado = selectAlumno.value;
    mostrarDatos(fechaSeleccionada, "filtrado", alumnoSeleccionado);
  });
  