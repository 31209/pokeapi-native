import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-:.\' '.split('');
const MAX_ATTEMPTS = 6;

export default function JuegoHarryPotter() {
  const [charName, setCharName] = useState('');
  const [charImage, setCharImage] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [userWin, setUserWin] = useState(0);
  const [userLose, setUserLose] = useState(0);

  // Detectar usuario logueado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return unsubscribe;
  }, []);

  // Traer datos de usuario (ganados/perdidos)
  useEffect(() => {
    if (!uid) return;
    const traerDatos = async () => {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserWin(data.ganados || 0);
        setUserLose(data.perdidos || 0);
      } else {
        await setDoc(docRef, { ganados: 0, perdidos: 0 });
      }
      setLoading(false);
    };
    traerDatos();
  }, [uid]);

  // Cargar personaje aleatorio
  const getRandomCharacter = async () => {
    try {
      const res = await fetch("https://api.potterdb.com/v1/characters");
      const json = await res.json();
      const characters = json.data.filter((c) => c.attributes.name && c.attributes.name.length > 3);
      const randomChar = characters[Math.floor(Math.random() * characters.length)].attributes;
      setCharName(randomChar.name.toUpperCase());
      setCharImage(randomChar.image || '');
      setGuessedLetters([]);
      setWrongGuesses(0);
      setGameOver(false);
      setGameWon(false);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener personaje:', err);
    }
  };

  useEffect(() => {
    getRandomCharacter();
  }, []);

  // Guardar resultado en Firebase
  const guardarResultado = async (acierto) => {
    if (!uid) return;
    const fecha = new Date().toISOString();
    const resultado = {
      uid,
      personaje: charName,
      aciertos: acierto ? 1 : 0,
      errores: acierto ? 0 : 1,
      fecha,
    };

    try {
      await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), resultado);
      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, {
        ganados: acierto ? userWin + 1 : userWin,
        perdidos: !acierto ? userLose + 1 : userLose,
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  const handleLetterClick = async (letter) => {
    if (guessedLetters.includes(letter) || gameOver || gameWon) return;

    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (!charName.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= MAX_ATTEMPTS) {
        setGameOver(true);
        setUserLose(userLose + 1);
        await guardarResultado(false);
      }
    } else {
      const allCorrect = charName.split('').every((l) => updatedGuessed.includes(l) || l === ' ');
      if (allCorrect) {
        setGameWon(true);
        setUserWin(userWin + 1);
        await guardarResultado(true);
      }
    }
  };

  const renderWord = () =>
    charName.split('').map((letter, i) => (
      <Text key={i} style={styles.letter}>
        {guessedLetters.includes(letter) || gameOver || gameWon || letter === ' ' ? letter : '_'}
      </Text>
    ));

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5E17EB" />
        <Text>Cargando personaje mágico...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔮 Adivina el Mago</Text>
      <Text style={styles.stats}>Ganados: {userWin} | Perdidos: {userLose}</Text>

      {charImage ? (
        <Image source={{ uri: charImage }} style={styles.image} />
      ) : (
        <Text style={{ marginBottom: 10, color: '#666' }}>Sin imagen disponible</Text>
      )}

      <View style={styles.wordContainer}>{renderWord()}</View>

      <View style={styles.keyboard}>
        {ALPHABET.map((letter) => (
          <TouchableOpacity
            key={letter}
            onPress={() => handleLetterClick(letter)}
            disabled={guessedLetters.includes(letter) || gameOver || gameWon}
            style={[
              styles.key,
              guessedLetters.includes(letter) && styles.keyDisabled,
            ]}
          >
            <Text>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.attempts}>
        Fallos: {wrongGuesses} / {MAX_ATTEMPTS}
      </Text>

      {gameOver && <Text style={styles.lost}>💀 ¡Perdiste! Era: {charName}</Text>}
      {gameWon && <Text style={styles.won}>🎉 ¡Ganaste!</Text>}

      {(gameOver || gameWon) && (
        <TouchableOpacity style={styles.button} onPress={getRandomCharacter}>
          <Text style={styles.buttonText}>Jugar otra vez</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 10, fontWeight: 'bold', color: '#5E17EB' },
  image: { width: 150, height: 150, borderRadius: 75, marginVertical: 10 },
  stats: { marginBottom: 10, fontSize: 16 },
  wordContainer: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  letter: { fontSize: 26, marginHorizontal: 4, fontWeight: 'bold' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  key: { backgroundColor: '#eee', padding: 10, margin: 4, borderRadius: 4, width: 40, alignItems: 'center' },
  keyDisabled: { backgroundColor: '#ccc' },
  attempts: { fontSize: 16, marginBottom: 10 },
  lost: { color: 'red', fontSize: 18 },
  won: { color: 'green', fontSize: 18 },
  button: { marginTop: 10, padding: 10, backgroundColor: '#5E17EB', borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});
