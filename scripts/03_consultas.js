// =============================================================================
// 03_consultas.js
// Consultas sobre la base "renta_videos": búsquedas simples y agregaciones.
// Ejecutar con:  mongosh "mongodb://localhost:27017" --file scripts/03_consultas.js
// Requiere MongoDB 5.0 o superior (se usa $dateDiff).
// =============================================================================

const bd = db.getSiblingDB("renta_videos");

// Fecha de referencia fija ("hoy") para que los resultados siempre sean los mismos
const FECHA_REF = ISODate("2026-11-06T00:00:00Z");

const mostrar = (titulo, resultado) => {
  console.log("\n=== " + titulo + " ===");
  console.log(JSON.stringify(resultado, null, 2));
};

// -----------------------------------------------------------------------------
// BLOQUE A — Consultas simples (find)
// -----------------------------------------------------------------------------

// C1. Catálogo de películas ordenado por año
mostrar("C1. Catálogo de películas ordenado por año",
  bd.peliculas
    .find({}, { _id: 0, titulo: 1, anio: 1, genero: 1, precio_renta: 1 })
    .sort({ anio: 1 })
    .toArray()
);

// C2. Películas de animación que cuestan 5 Bs/día o menos
mostrar("C2. Películas de Animación con precio_renta <= 5 Bs",
  bd.peliculas
    .find({ genero: "Animación", precio_renta: { $lte: 5 } }, { _id: 0, titulo: 1, precio_renta: 1 })
    .sort({ precio_renta: 1, titulo: 1 })
    .toArray()
);

// C3. Búsqueda de texto por título o director (usa el índice de texto)
mostrar("C3. Búsqueda de texto: 'futuro padrino'",
  bd.peliculas
    .find({ $text: { $search: "futuro padrino" } }, { _id: 0, titulo: 1, score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .toArray()
);

// C4. Clientes activos de La Paz
mostrar("C4. Clientes activos de La Paz",
  bd.clientes
    .find({ "direccion.ciudad": "La Paz", activo: true }, { _id: 1, nombre: 1, telefono: 1, "direccion.zona": 1 })
    .sort({ nombre: 1 })
    .toArray()
);

// -----------------------------------------------------------------------------
// BLOQUE B — Disponibilidad y rentas (aggregate + $lookup)
// -----------------------------------------------------------------------------

// C5. Copias disponibles por película
mostrar("C5. Copias disponibles por película",
  bd.peliculas.aggregate([
    {
      $project: {
        _id: 0,
        titulo: 1,
        total_copias: { $size: "$copias" },
        disponibles: {
          $size: { $filter: { input: "$copias", as: "c", cond: { $eq: ["$$c.estado", "disponible"] } } }
        }
      }
    },
    { $sort: { disponibles: 1, titulo: 1 } }
  ]).toArray()
);

// C6. Rentas activas con el nombre del cliente
mostrar("C6. Rentas activas (sin devolver)",
  bd.rentas.aggregate([
    { $match: { estado: "activa" } },
    { $lookup: { from: "clientes", localField: "cliente_id", foreignField: "_id", as: "cliente" } },
    { $unwind: "$cliente" },
    {
      $project: {
        cliente: "$cliente.nombre",
        fecha_renta: 1,
        fecha_vencimiento: 1,
        peliculas: "$items.titulo",
        total: 1
      }
    },
    { $sort: { fecha_vencimiento: 1 } }
  ]).toArray()
);

// C7. Rentas vencidas: días de atraso y multa estimada (Bs 2 por copia y por día)
mostrar("C7. Rentas vencidas al " + FECHA_REF.toISOString().slice(0, 10),
  bd.rentas.aggregate([
    { $match: { estado: "activa", fecha_vencimiento: { $lt: FECHA_REF } } },
    { $lookup: { from: "clientes", localField: "cliente_id", foreignField: "_id", as: "cliente" } },
    { $unwind: "$cliente" },
    {
      $addFields: {
        dias_atraso: { $dateDiff: { startDate: "$fecha_vencimiento", endDate: FECHA_REF, unit: "day" } }
      }
    },
    {
      $project: {
        cliente: "$cliente.nombre",
        telefono: "$cliente.telefono",
        peliculas: "$items.titulo",
        fecha_vencimiento: 1,
        dias_atraso: 1,
        multa_estimada: { $multiply: ["$dias_atraso", 2, { $size: "$items" }] }
      }
    },
    { $sort: { dias_atraso: -1 } }
  ]).toArray()
);

// C8. Historial de rentas de un cliente (una fila por película rentada)
mostrar("C8. Historial de rentas del cliente cli-001",
  bd.rentas.aggregate([
    { $match: { cliente_id: "cli-001" } },
    { $unwind: "$items" },
    {
      $project: {
        _id: 0,
        renta: "$_id",
        fecha_renta: 1,
        pelicula: "$items.titulo",
        copia: "$items.codigo_copia",
        estado: 1
      }
    },
    { $sort: { fecha_renta: 1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// BLOQUE C — Estadísticas (agrupaciones)
// -----------------------------------------------------------------------------

// C9. Las 5 películas más rentadas
mostrar("C9. Top 5 películas más rentadas",
  bd.rentas.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.titulo", veces_rentada: { $sum: 1 } } },
    { $sort: { veces_rentada: -1, _id: 1 } },
    { $limit: 5 },
    { $project: { _id: 0, pelicula: "$_id", veces_rentada: 1 } }
  ]).toArray()
);

// C10. Ingresos por mes (rentas + multas)
mostrar("C10. Ingresos por mes",
  bd.rentas.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$fecha_renta" } },
        rentas: { $sum: 1 },
        ingresos_renta: { $sum: "$total" },
        ingresos_multas: { $sum: "$multa" }
      }
    },
    { $addFields: { ingresos_totales: { $add: ["$ingresos_renta", "$ingresos_multas"] } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, mes: "$_id", rentas: 1, ingresos_renta: 1, ingresos_multas: 1, ingresos_totales: 1 } }
  ]).toArray()
);

// C11. Los 3 mejores clientes (más rentas y más gasto)
mostrar("C11. Top 3 clientes",
  bd.rentas.aggregate([
    {
      $group: {
        _id: "$cliente_id",
        rentas: { $sum: 1 },
        gastado: { $sum: { $add: ["$total", "$multa"] } }
      }
    },
    { $sort: { rentas: -1, gastado: -1 } },
    { $limit: 3 },
    { $lookup: { from: "clientes", localField: "_id", foreignField: "_id", as: "cliente" } },
    { $unwind: "$cliente" },
    { $project: { _id: 0, cliente: "$cliente.nombre", rentas: 1, gastado: 1 } }
  ]).toArray()
);

// C12. Géneros más rentados (une rentas con películas)
mostrar("C12. Géneros más rentados",
  bd.rentas.aggregate([
    { $unwind: "$items" },
    { $lookup: { from: "peliculas", localField: "items.pelicula_id", foreignField: "_id", as: "pel" } },
    { $unwind: "$pel" },
    { $unwind: "$pel.genero" },
    { $group: { _id: "$pel.genero", rentas: { $sum: 1 } } },
    { $sort: { rentas: -1, _id: 1 } },
    { $project: { _id: 0, genero: "$_id", rentas: 1 } }
  ]).toArray()
);

// C13. Clientes que nunca han rentado
mostrar("C13. Clientes sin ninguna renta",
  bd.clientes.aggregate([
    { $lookup: { from: "rentas", localField: "_id", foreignField: "cliente_id", as: "rentas" } },
    { $match: { rentas: { $size: 0 } } },
    { $project: { nombre: 1, activo: 1 } }
  ]).toArray()
);
