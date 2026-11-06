// =============================================================================
// 01_crear.js
// Crea la base de datos "renta_videos": colecciones, validaciones e índices.
// Ejecutar con:  mongosh "mongodb://localhost:27017" --file scripts/01_crear.js
// ATENCIÓN: borra la base de datos anterior para poder repetir la práctica.
// =============================================================================

const bd = db.getSiblingDB("renta_videos");

console.log("== Eliminando la base de datos anterior (si existe) ==");
bd.dropDatabase();

// -----------------------------------------------------------------------------
// 1) COLECCIONES CON VALIDACIÓN DE ESQUEMA ($jsonSchema)
// -----------------------------------------------------------------------------
console.log("== Creando colecciones con validación de esquema ==");

// ---- clientes ---------------------------------------------------------------
bd.createCollection("clientes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "nombre", "ci", "telefono", "direccion", "fecha_registro", "activo"],
      properties: {
        _id: { bsonType: "string", description: "Código del cliente, ej. cli-001" },
        nombre: { bsonType: "string", minLength: 3 },
        ci: { bsonType: "string", pattern: "^[0-9]{6,10}$", description: "Cédula de identidad (solo dígitos)" },
        telefono: { bsonType: "string", pattern: "^[67][0-9]{7}$", description: "Celular boliviano de 8 dígitos" },
        correo: { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
        direccion: {
          bsonType: "object",
          required: ["ciudad", "zona", "calle"],
          properties: {
            ciudad: { bsonType: "string" },
            zona: { bsonType: "string" },
            calle: { bsonType: "string" }
          }
        },
        fecha_registro: { bsonType: "date" },
        activo: { bsonType: "bool" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// ---- empleados --------------------------------------------------------------
bd.createCollection("empleados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "nombre", "cargo", "sucursal"],
      properties: {
        _id: { bsonType: "string" },
        nombre: { bsonType: "string", minLength: 3 },
        cargo: { enum: ["Administrador", "Cajero"] },
        sucursal: { bsonType: "string" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// ---- peliculas (con sus copias físicas embebidas) ---------------------------
bd.createCollection("peliculas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "titulo", "genero", "anio", "director", "duracion_min", "clasificacion", "precio_renta", "copias"],
      properties: {
        _id: { bsonType: "string", description: "Código de la película, ej. pel-001" },
        titulo: { bsonType: "string", minLength: 1 },
        genero: { bsonType: "array", minItems: 1, items: { bsonType: "string" } },
        anio: { bsonType: "number", minimum: 1900, maximum: 2100 },
        director: { bsonType: "string" },
        actores: { bsonType: "array", items: { bsonType: "string" } },
        duracion_min: { bsonType: "number", minimum: 1 },
        clasificacion: { enum: ["ATP", "+13", "+16", "+18"] },
        precio_renta: { bsonType: "number", minimum: 0, description: "Precio por día en Bs" },
        copias: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["codigo", "formato", "estado"],
            properties: {
              codigo: { bsonType: "string" },
              formato: { enum: ["DVD", "Blu-ray", "VHS"] },
              estado: { enum: ["disponible", "rentada", "danada"] }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// ---- rentas (con las películas rentadas embebidas en "items") ---------------
bd.createCollection("rentas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "cliente_id", "empleado_id", "fecha_renta", "dias", "fecha_vencimiento",
                 "fecha_devolucion", "items", "total", "multa", "estado"],
      properties: {
        _id: { bsonType: "string", description: "Código de la renta, ej. ren-001" },
        cliente_id: { bsonType: "string" },
        empleado_id: { bsonType: "string" },
        fecha_renta: { bsonType: "date" },
        dias: { bsonType: "number", minimum: 1 },
        fecha_vencimiento: { bsonType: "date" },
        fecha_devolucion: { bsonType: ["date", "null"] },
        items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["pelicula_id", "titulo", "codigo_copia", "precio_dia"],
            properties: {
              pelicula_id: { bsonType: "string" },
              titulo: { bsonType: "string" },
              codigo_copia: { bsonType: "string" },
              precio_dia: { bsonType: "number", minimum: 0 }
            }
          }
        },
        total: { bsonType: "number", minimum: 0 },
        multa: { bsonType: "number", minimum: 0 },
        estado: { enum: ["activa", "devuelta"] }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// -----------------------------------------------------------------------------
// 2) ÍNDICES
// -----------------------------------------------------------------------------
console.log("== Creando índices ==");

bd.clientes.createIndex({ ci: 1 }, { unique: true, name: "uq_clientes_ci" });
bd.clientes.createIndex({ "direccion.ciudad": 1 }, { name: "ix_clientes_ciudad" });

bd.peliculas.createIndex(
  { titulo: "text", director: "text" },
  { name: "txt_titulo_director", default_language: "spanish" }
);
bd.peliculas.createIndex({ genero: 1, precio_renta: 1 }, { name: "ix_peliculas_genero_precio" });
bd.peliculas.createIndex({ "copias.codigo": 1 }, { unique: true, name: "uq_copias_codigo" });

bd.rentas.createIndex({ cliente_id: 1, fecha_renta: -1 }, { name: "ix_rentas_cliente_fecha" });
bd.rentas.createIndex({ estado: 1, fecha_vencimiento: 1 }, { name: "ix_rentas_estado_vencimiento" });
bd.rentas.createIndex({ "items.pelicula_id": 1 }, { name: "ix_rentas_pelicula" });

// -----------------------------------------------------------------------------
// 3) RESUMEN DE LO CREADO
// -----------------------------------------------------------------------------
console.log("\n== Base de datos: " + bd.getName() + " ==");
console.log("Colecciones creadas: " + bd.getCollectionNames().join(", "));

bd.getCollectionNames().forEach((nombre) => {
  const indices = bd.getCollection(nombre).getIndexes().map((i) => i.name);
  console.log("  - " + nombre + " -> índices: " + indices.join(", "));
});
