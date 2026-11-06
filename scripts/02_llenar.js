// =============================================================================
// 02_llenar.js
// Inserta los documentos de ejemplo: empleados, clientes, películas y rentas.
// Ejecutar con:  mongosh "mongodb://localhost:27017" --file scripts/02_llenar.js
// (Primero se debe haber ejecutado 01_crear.js)
// =============================================================================

const bd = db.getSiblingDB("renta_videos");

// Convierte "2026-10-20" en una fecha ISODate
const f = (iso) => ISODate(iso + "T00:00:00Z");
const DIA_MS = 24 * 60 * 60 * 1000;

// -----------------------------------------------------------------------------
// EMPLEADOS
// -----------------------------------------------------------------------------
const empleados = [
  { _id: "emp-01", nombre: "Carlos Mamani Quispe", cargo: "Administrador", sucursal: "Sopocachi" },
  { _id: "emp-02", nombre: "Lucía Rojas Condori", cargo: "Cajero", sucursal: "Sopocachi" },
  { _id: "emp-03", nombre: "Diego Flores Vargas", cargo: "Cajero", sucursal: "Miraflores" }
];

// -----------------------------------------------------------------------------
// CLIENTES
// -----------------------------------------------------------------------------
const clientes = [
  {
    _id: "cli-001", nombre: "Ana Lucía Choque Mamani", ci: "6543210", telefono: "71234567",
    correo: "ana.choque@correo.com",
    direccion: { ciudad: "La Paz", zona: "Sopocachi", calle: "Calle Belisario Salinas #345" },
    fecha_registro: f("2026-03-15"), activo: true
  },
  {
    _id: "cli-002", nombre: "Marco Antonio Quispe Limachi", ci: "7891234", telefono: "76543210",
    correo: "marco.quispe@correo.com",
    direccion: { ciudad: "El Alto", zona: "Ciudad Satélite", calle: "Av. Juan Pablo II #120" },
    fecha_registro: f("2026-03-20"), activo: true
  },
  {
    _id: "cli-003", nombre: "Valeria Fernández Rocha", ci: "8123456", telefono: "69876543",
    correo: "valeria.fernandez@correo.com",
    direccion: { ciudad: "Cochabamba", zona: "Cala Cala", calle: "Calle Ecuador #78" },
    fecha_registro: f("2026-04-02"), activo: true
  },
  {
    _id: "cli-004", nombre: "Jhonny Paredes Gutiérrez", ci: "5432167", telefono: "72345678",
    direccion: { ciudad: "La Paz", zona: "Miraflores", calle: "Calle Landaeta #910" },
    fecha_registro: f("2026-04-18"), activo: true
  },
  {
    _id: "cli-005", nombre: "Daniela Mendoza Vega", ci: "9012345", telefono: "78901234",
    correo: "daniela.mendoza@correo.com",
    direccion: { ciudad: "La Paz", zona: "Calacoto", calle: "Calle 21 #8456" },
    fecha_registro: f("2026-05-07"), activo: true
  },
  {
    _id: "cli-006", nombre: "Rodrigo Salazar Peña", ci: "6789012", telefono: "65432109",
    correo: "rodrigo.salazar@correo.com",
    direccion: { ciudad: "Cochabamba", zona: "Queru Queru", calle: "Av. América #567" },
    fecha_registro: f("2026-06-11"), activo: true
  },
  {
    _id: "cli-007", nombre: "Fabiola Condori Apaza", ci: "7654321", telefono: "71122334",
    direccion: { ciudad: "El Alto", zona: "Villa Adela", calle: "Av. Bolivia #432" },
    fecha_registro: f("2026-06-30"), activo: false
  },
  {
    _id: "cli-008", nombre: "Sebastián Ríos Montaño", ci: "8765432", telefono: "73344556",
    correo: "sebastian.rios@correo.com",
    direccion: { ciudad: "La Paz", zona: "San Pedro", calle: "Calle Yanacocha #234" },
    fecha_registro: f("2026-07-21"), activo: true
  }
];

// -----------------------------------------------------------------------------
// PELÍCULAS (cada una con sus copias físicas embebidas)
// Código de copia: PEL001-A, PEL001-B, ...
// -----------------------------------------------------------------------------
const pelicula = (id, titulo, genero, anio, director, actores, duracion_min, clasificacion, precio_renta, formatos) => ({
  _id: id,
  titulo,
  genero,
  anio,
  director,
  actores,
  duracion_min,
  clasificacion,
  precio_renta, // Bs por día
  copias: formatos.map((formato, i) => ({
    codigo: id.toUpperCase().replace("-", "") + "-" + String.fromCharCode(65 + i),
    formato,
    estado: "disponible"
  }))
});

const peliculas = [
  pelicula("pel-001", "El Padrino", ["Drama", "Crimen"], 1972, "Francis Ford Coppola",
    ["Marlon Brando", "Al Pacino"], 175, "+16", 6, ["DVD", "DVD", "Blu-ray"]),
  pelicula("pel-002", "Titanic", ["Drama", "Romance"], 1997, "James Cameron",
    ["Leonardo DiCaprio", "Kate Winslet"], 195, "+13", 5, ["DVD", "DVD"]),
  pelicula("pel-003", "Matrix", ["Ciencia ficción", "Acción"], 1999, "Lana Wachowski y Lilly Wachowski",
    ["Keanu Reeves", "Laurence Fishburne"], 136, "+16", 6, ["DVD", "DVD", "Blu-ray"]),
  pelicula("pel-004", "Toy Story", ["Animación", "Comedia"], 1995, "John Lasseter",
    ["Tom Hanks", "Tim Allen"], 81, "ATP", 4, ["DVD", "DVD", "DVD"]),
  pelicula("pel-005", "Volver al Futuro", ["Ciencia ficción", "Comedia"], 1985, "Robert Zemeckis",
    ["Michael J. Fox", "Christopher Lloyd"], 116, "ATP", 5, ["DVD", "DVD"]),
  pelicula("pel-006", "Jurassic Park", ["Aventura", "Ciencia ficción"], 1993, "Steven Spielberg",
    ["Sam Neill", "Laura Dern", "Jeff Goldblum"], 127, "+13", 6, ["DVD", "Blu-ray"]),
  pelicula("pel-007", "El Rey León", ["Animación", "Aventura"], 1994, "Roger Allers y Rob Minkoff",
    ["Matthew Broderick", "Jeremy Irons"], 88, "ATP", 4, ["DVD", "DVD", "DVD"]),
  pelicula("pel-008", "Parásitos", ["Drama", "Suspenso"], 2019, "Bong Joon-ho",
    ["Song Kang-ho", "Choi Woo-shik"], 132, "+16", 8, ["Blu-ray", "Blu-ray"]),
  pelicula("pel-009", "Coco", ["Animación", "Aventura"], 2017, "Lee Unkrich",
    ["Anthony Gonzalez", "Gael García Bernal"], 105, "ATP", 7, ["Blu-ray", "DVD"]),
  pelicula("pel-010", "Gladiador", ["Acción", "Drama"], 2000, "Ridley Scott",
    ["Russell Crowe", "Joaquin Phoenix"], 155, "+16", 5, ["DVD", "DVD"]),
  pelicula("pel-011", "Interestelar", ["Ciencia ficción", "Drama"], 2014, "Christopher Nolan",
    ["Matthew McConaughey", "Anne Hathaway"], 169, "+13", 8, ["Blu-ray", "Blu-ray", "DVD"]),
  pelicula("pel-012", "Shrek", ["Animación", "Comedia"], 2001, "Andrew Adamson y Vicky Jenson",
    ["Mike Myers", "Eddie Murphy", "Cameron Diaz"], 90, "ATP", 4, ["DVD", "DVD"])
];

// Busca una copia física por su código y devuelve { pelicula, copia }
const buscarCopia = (codigo) => {
  const p = peliculas.find((x) => x.copias.some((c) => c.codigo === codigo));
  if (!p) throw new Error("La copia no existe: " + codigo);
  return { pelicula: p, copia: p.copias.find((c) => c.codigo === codigo) };
};

// -----------------------------------------------------------------------------
// RENTAS
// total = suma(precio_dia de cada copia) * días
// multa = Bs 2 por copia y por día de retraso (solo si se devolvió tarde)
// -----------------------------------------------------------------------------
const MULTA_POR_DIA_Y_COPIA = 2;

const renta = (id, cliente_id, empleado_id, fechaRenta, dias, codigosCopias, fechaDevolucion) => {
  const fecha_renta = f(fechaRenta);
  const fecha_vencimiento = new Date(fecha_renta.getTime() + dias * DIA_MS);
  const fecha_devolucion = fechaDevolucion ? f(fechaDevolucion) : null;

  const items = codigosCopias.map((codigo) => {
    const { pelicula: p } = buscarCopia(codigo);
    return { pelicula_id: p._id, titulo: p.titulo, codigo_copia: codigo, precio_dia: p.precio_renta };
  });

  const total = items.reduce((suma, it) => suma + it.precio_dia, 0) * dias;

  let multa = 0;
  if (fecha_devolucion && fecha_devolucion > fecha_vencimiento) {
    const diasAtraso = Math.ceil((fecha_devolucion - fecha_vencimiento) / DIA_MS);
    multa = diasAtraso * MULTA_POR_DIA_Y_COPIA * items.length;
  }

  return {
    _id: id, cliente_id, empleado_id, fecha_renta, dias, fecha_vencimiento, fecha_devolucion,
    items, total, multa, estado: fecha_devolucion ? "devuelta" : "activa"
  };
};

const rentas = [
  // ---- Rentas ya devueltas ----
  renta("ren-001", "cli-001", "emp-02", "2026-08-05", 3, ["PEL004-A", "PEL007-A"], "2026-08-08"),
  renta("ren-002", "cli-002", "emp-02", "2026-08-12", 3, ["PEL003-A"], "2026-08-17"),            // 2 días tarde
  renta("ren-003", "cli-003", "emp-03", "2026-08-20", 2, ["PEL008-A"], "2026-08-22"),
  renta("ren-004", "cli-001", "emp-01", "2026-09-02", 3, ["PEL001-A", "PEL011-A"], "2026-09-05"),
  renta("ren-005", "cli-004", "emp-02", "2026-09-10", 5, ["PEL002-A"], "2026-09-16"),            // 1 día tarde
  renta("ren-006", "cli-005", "emp-03", "2026-09-14", 2, ["PEL009-A", "PEL012-A"], "2026-09-16"),
  renta("ren-007", "cli-002", "emp-02", "2026-09-20", 3, ["PEL006-A"], "2026-09-23"),
  renta("ren-008", "cli-006", "emp-03", "2026-09-25", 3, ["PEL010-A", "PEL005-A"], "2026-09-30"), // 2 días tarde
  renta("ren-009", "cli-001", "emp-02", "2026-10-03", 2, ["PEL009-B"], "2026-10-05"),
  renta("ren-010", "cli-003", "emp-03", "2026-10-08", 3, ["PEL011-B", "PEL003-B"], "2026-10-11"),
  // ---- Rentas activas (sin devolver) ----
  renta("ren-011", "cli-004", "emp-02", "2026-10-28", 3, ["PEL001-B"], null),                    // vencida
  renta("ren-012", "cli-006", "emp-03", "2026-11-02", 5, ["PEL004-B", "PEL012-B"], null),        // vigente
  renta("ren-013", "cli-005", "emp-02", "2026-11-04", 3, ["PEL008-B"], null),                    // vigente
  renta("ren-014", "cli-002", "emp-01", "2026-10-30", 4, ["PEL003-C", "PEL011-C"], null)         // vencida
];

// Las copias de las rentas activas quedan marcadas como "rentada"
rentas
  .filter((r) => r.estado === "activa")
  .forEach((r) => r.items.forEach((it) => { buscarCopia(it.codigo_copia).copia.estado = "rentada"; }));

// Una copia dañada, para tener un ejemplo de ese estado
buscarCopia("PEL002-B").copia.estado = "danada";

// -----------------------------------------------------------------------------
// INSERCIÓN
// -----------------------------------------------------------------------------
console.log("== Insertando documentos ==");

const r1 = bd.empleados.insertMany(empleados);
console.log("empleados:  " + Object.keys(r1.insertedIds).length + " documentos insertados");

const r2 = bd.clientes.insertMany(clientes);
console.log("clientes:   " + Object.keys(r2.insertedIds).length + " documentos insertados");

const r3 = bd.peliculas.insertMany(peliculas);
console.log("peliculas:  " + Object.keys(r3.insertedIds).length + " documentos insertados");

const r4 = bd.rentas.insertMany(rentas);
console.log("rentas:     " + Object.keys(r4.insertedIds).length + " documentos insertados");

// -----------------------------------------------------------------------------
// VERIFICACIÓN
// -----------------------------------------------------------------------------
console.log("\n== Conteo de documentos por colección ==");
console.log(JSON.stringify({
  empleados: bd.empleados.countDocuments(),
  clientes: bd.clientes.countDocuments(),
  peliculas: bd.peliculas.countDocuments(),
  rentas: bd.rentas.countDocuments()
}, null, 2));

console.log("\n== Ejemplo: una película con sus copias ==");
console.log(JSON.stringify(bd.peliculas.findOne({ _id: "pel-001" }), null, 2));

console.log("\n== Ejemplo: una renta con sus items ==");
console.log(JSON.stringify(bd.rentas.findOne({ _id: "ren-004" }), null, 2));
