// =============================================================================
// 04_actualizar_eliminar.js
// Operaciones de escritura: registrar una renta, devolverla, actualizar,
// eliminar y probar las validaciones del esquema.
// Ejecutar con:  mongosh "mongodb://localhost:27017" --file scripts/04_actualizar_eliminar.js
// Para volver a los datos originales ejecutar de nuevo 01_crear.js y 02_llenar.js
// =============================================================================

const bd = db.getSiblingDB("renta_videos");

const FECHA_REF = ISODate("2026-11-06T00:00:00Z"); // "hoy" fijo para repetir la práctica
const DIA_MS = 24 * 60 * 60 * 1000;

const mostrar = (titulo, resultado) => {
  console.log("\n=== " + titulo + " ===");
  console.log(JSON.stringify(resultado, null, 2));
};

// -----------------------------------------------------------------------------
// U1. REGISTRAR UNA RENTA NUEVA
//     El cliente cli-008 renta la copia PEL007-B (El Rey León) por 3 días.
// -----------------------------------------------------------------------------
const codigoCopia = "PEL007-B";
const dias = 3;

const peli = bd.peliculas.findOne({ "copias.codigo": codigoCopia });
const copia = peli.copias.find((c) => c.codigo === codigoCopia);

if (copia.estado !== "disponible") {
  throw new Error("La copia " + codigoCopia + " no está disponible (estado: " + copia.estado + ")");
}

bd.rentas.insertOne({
  _id: "ren-015",
  cliente_id: "cli-008",
  empleado_id: "emp-02",
  fecha_renta: FECHA_REF,
  dias: dias,
  fecha_vencimiento: new Date(FECHA_REF.getTime() + dias * DIA_MS),
  fecha_devolucion: null,
  items: [{ pelicula_id: peli._id, titulo: peli.titulo, codigo_copia: codigoCopia, precio_dia: peli.precio_renta }],
  total: peli.precio_renta * dias,
  multa: 0,
  estado: "activa"
});

// La copia pasa a "rentada" (el operador $ actualiza el elemento del arreglo que coincidió)
bd.peliculas.updateOne(
  { _id: peli._id, "copias.codigo": codigoCopia },
  { $set: { "copias.$.estado": "rentada" } }
);

mostrar("U1. Renta registrada (ren-015)", bd.rentas.findOne({ _id: "ren-015" }));
mostrar("U1. Copias de El Rey León después de la renta",
  bd.peliculas.findOne({ _id: "pel-007" }, { _id: 0, titulo: 1, copias: 1 }));

// -----------------------------------------------------------------------------
// U2. DEVOLVER UNA RENTA VENCIDA (ren-011) Y CALCULAR LA MULTA
// -----------------------------------------------------------------------------
const r = bd.rentas.findOne({ _id: "ren-011" });
const diasAtraso = Math.max(0, Math.ceil((FECHA_REF - r.fecha_vencimiento) / DIA_MS));
const multa = diasAtraso * 2 * r.items.length; // Bs 2 por copia y por día

bd.rentas.updateOne(
  { _id: r._id },
  { $set: { estado: "devuelta", fecha_devolucion: FECHA_REF, multa: multa } }
);

// Cada copia devuelta vuelve a estar disponible (arrayFilters elige la copia exacta)
r.items.forEach((it) => {
  bd.peliculas.updateOne(
    { _id: it.pelicula_id },
    { $set: { "copias.$[c].estado": "disponible" } },
    { arrayFilters: [{ "c.codigo": it.codigo_copia }] }
  );
});

mostrar("U2. Renta ren-011 devuelta con multa (" + diasAtraso + " días de atraso)",
  bd.rentas.findOne({ _id: "ren-011" }, { estado: 1, fecha_vencimiento: 1, fecha_devolucion: 1, multa: 1 }));

// -----------------------------------------------------------------------------
// U3. ACTUALIZAR VARIOS DOCUMENTOS: subir 1 Bs el precio de las películas de animación
// -----------------------------------------------------------------------------
const resPrecio = bd.peliculas.updateMany({ genero: "Animación" }, { $inc: { precio_renta: 1 } });
mostrar("U3. Películas de Animación con precio actualizado (+1 Bs)", {
  coincidencias: resPrecio.matchedCount,
  modificadas: resPrecio.modifiedCount,
  precios: bd.peliculas.find({ genero: "Animación" }, { _id: 0, titulo: 1, precio_renta: 1 }).toArray()
});

// -----------------------------------------------------------------------------
// U4. ACTUALIZAR UN CAMPO: nuevo teléfono para cli-005
// -----------------------------------------------------------------------------
bd.clientes.updateOne({ _id: "cli-005" }, { $set: { telefono: "78905566" } });
mostrar("U4. Cliente cli-005 con teléfono actualizado",
  bd.clientes.findOne({ _id: "cli-005" }, { nombre: 1, telefono: 1 }));

// -----------------------------------------------------------------------------
// U5. ELIMINAR UN ELEMENTO DE UN ARREGLO: retirar las copias dañadas de Titanic
// -----------------------------------------------------------------------------
bd.peliculas.updateOne({ _id: "pel-002" }, { $pull: { copias: { estado: "danada" } } });
mostrar("U5. Copias de Titanic después de retirar las dañadas",
  bd.peliculas.findOne({ _id: "pel-002" }, { _id: 0, titulo: 1, copias: 1 }));

// -----------------------------------------------------------------------------
// U6. ELIMINAR UN DOCUMENTO: borrar al cliente inactivo cli-007 (sin rentas)
// -----------------------------------------------------------------------------
if (bd.rentas.countDocuments({ cliente_id: "cli-007" }) === 0) {
  const resDel = bd.clientes.deleteOne({ _id: "cli-007", activo: false });
  mostrar("U6. Cliente cli-007 eliminado", { eliminados: resDel.deletedCount });
}

// -----------------------------------------------------------------------------
// V1. PRUEBA DE VALIDACIÓN: intentar insertar datos incorrectos
// -----------------------------------------------------------------------------
console.log("\n=== V1. Prueba de validación: cliente con teléfono inválido ===");
try {
  bd.clientes.insertOne({
    _id: "cli-999", nombre: "Cliente de Prueba", ci: "1234567", telefono: "12345",
    direccion: { ciudad: "La Paz", zona: "Centro", calle: "Calle Comercio #1" },
    fecha_registro: FECHA_REF, activo: true
  });
  console.log("ERROR: el documento inválido fue aceptado");
} catch (e) {
  console.log("Inserción rechazada por la validación del esquema: " + e.message);
}

console.log("\n=== V2. Prueba de validación: CI repetido (índice único) ===");
try {
  bd.clientes.insertOne({
    _id: "cli-998", nombre: "Otro Cliente", ci: "6543210", telefono: "71234000",
    direccion: { ciudad: "La Paz", zona: "Centro", calle: "Calle Comercio #2" },
    fecha_registro: FECHA_REF, activo: true
  });
  console.log("ERROR: el CI duplicado fue aceptado");
} catch (e) {
  console.log("Inserción rechazada: " + e.message);
}
