import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator } from 'react-native';

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch("https://api.potterdb.com/v1/characters");
        const json = await res.json();
        setData(json.data); // La API usa data.data
      } catch (error) {
        console.error("Error al obtener personajes:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, []);

  if (loading) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#5E17EB" />
        <Text style={{ color: "#5E17EB" }}>Cargando personajes mágicos...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.lista}>
        {data.map((item, index) => {
          const personaje = item.attributes;
          return (
            <View key={index} style={[styles.item, estilosCasa(personaje.house)]}>
              {personaje.image && (
                <Image
                  source={{ uri: personaje.image }}
                  style={styles.imagen}
                />
              )}
              <Text style={styles.nombre}>{personaje.name}</Text>
              {personaje.house && <Text style={styles.casa}>🏰 {personaje.house}</Text>}
              {personaje.patronus && <Text style={styles.detalle}>🦌 {personaje.patronus}</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const estilosCasa = (house) => {
  switch (house) {
    case "Gryffindor":
      return { borderColor: "#7F0909", backgroundColor: "#FFD700" };
    case "Slytherin":
      return { borderColor: "#1A472A", backgroundColor: "#B8CBB8" };
    case "Ravenclaw":
      return { borderColor: "#0E1A40", backgroundColor: "#C0C0E0" };
    case "Hufflepuff":
      return { borderColor: "#EEE117", backgroundColor: "#FFFACD" };
    default:
      return { borderColor: "#999", backgroundColor: "#EDEDED" };
  }
};

const styles = StyleSheet.create({
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  item: {
    width: '46%',
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  imagen: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  casa: {
    fontSize: 14,
    color: '#333',
  },
  detalle: {
    fontSize: 13,
    color: '#666',
  },
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});
