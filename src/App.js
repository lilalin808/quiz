import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import "./App.css";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyC6H2NaGIybnyu2tH0nT7royeibAebJAIY",
  authDomain: "model-191ff.firebaseapp.com",
  projectId: "model-191ff",
  storageBucket: "model-191ff.firebasestorage.app",
  messagingSenderId: "715464346435",
  appId: "1:715464346435:web:9e7a2105772e38a903bdf6",
  measurementId: "G-Y1X9FJZ082",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const auth = getAuth();

// The Sketchfab viewer script needs to be added to the document head
const SketchfabViewer = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const iframe = document.getElementById("api-frame");
      const version = "1.12.1";
      const uid = "8e7464e733e742a3a97c6b4b376aeafe";

      const client = new window.Sketchfab(version, iframe);
      const error = () => console.error("Sketchfab API error");
      const success = (api) => {
        api.start(() => {});
        api.addEventListener("viewerready", function () {
          api.getAnnotationList(function (err, annots) {
            if (!err) {
              console.log(annots);
            }
          });
          emptyAnnotations(api);
        });
      };

      client.init(uid, {
        success,
        error,
        autostart: 1,
        preload: 1,
        annotation_tooltip_visible: 0,
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const emptyAnnotations = (api) => {
    for (let i = 0; i < 10; i++) {
      try {
        api.updateAnnotation(i, {
          title: "---",
          content: undefined,
        });
        console.log(`Annotation ${i} updated successfully.`);
      } catch (error) {
        console.error(`Error updating annotation ${i}:`, error);
      }
    }
  };

  return (
    <iframe
      id="api-frame"
      width="800"
      height="500"
      frameBorder="0"
      allowFullScreen
    />
  );
};

const App = () => {
  const annotations = [
    { name: "Optic chiasm" },
    { name: "Optic nerve" },
    { name: "Pituitary gland" },
    { name: "Tuberculum" },
    { name: "Carotid artery" },
    { name: "Clivus" },
    { name: "Odontoid" },
    { name: "C1 Ring" },
    { name: "Middle turbinate" },
    { name: "Medial OCR" },
  ];

  const questions = [
    {
      question: "Where is the Carotid artery?",
      correctAnswerIndex: "5",
      options: ["0", "1", "2", "4", "5"],
    },
    {
      question: "Where is the Optic chiasm?",
      correctAnswerIndex: "1",
      options: ["1", "3", "5", "7", "9"],
    },
    {
      question: "Where is the Pituitary gland?",
      correctAnswerIndex: "3",
      options: ["1", "3", "4", "7", "8"],
    },
    {
      question: "Where is the Clivus?",
      correctAnswerIndex: "6",
      options: ["0", "6", "2", "8", "9"],
    },
    {
      question: "Where is the Odontoid?",
      correctAnswerIndex: "7",
      options: ["1", "4", "6", "7", "9"],
    },
    {
      question: "Where is the Tuberculum?",
      correctAnswerIndex: "4",
      options: ["0", "4", "5", "7", "9"],
    },
    {
      question: "Where is the Optic nerve?",
      correctAnswerIndex: "2",
      options: ["1", "2", "5", "7", "8"],
    },
    {
      question: "Where is the C1 ring?",
      correctAnswerIndex: "8",
      options: ["3", "7", "6", "8", "9"],
    },
    {
      question: "Where is the Medial OCR?",
      correctAnswerIndex: "10",
      options: ["1", "10", "5", "8", "0"],
    },
    {
      question: "Where is the Middle turbinate?",
      correctAnswerIndex: "9",
      options: ["9", "0", "7", "2", "5"],
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showTryAgain, setShowTryAgain] = useState(false);
  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await addDoc(doc(db, "users", user.uid), { email });
      setSuccessMessage("account created");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Email Address Already Exists");
      }
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setSuccessMessage("login succesful");
      localStorage.setItem("loggedInUserId", userCredential.user.uid);
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        setErrorMessage("Incorrect Email or Password");
      } else {
        setErrorMessage("Account does not Exist");
      }
    }
  };

  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleAnswer = (index) => {
    setSelectedIndex(index); // Track the selected answer index
    const correctAnswer = questions[currentQuestionIndex].correctAnswerIndex;
    const selectedAnswer = questions[currentQuestionIndex].options[index];
    if (selectedAnswer === correctAnswer) {
      setScore(score + 1);
      setResultMessage("correct");
    } else {
      setResultMessage("incorrect, the answer is: " + correctAnswer);
    }
    setIsAnswered(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswered(false);
    } else {
      alert(`Your score: ${score}/${questions.length}`);

      submitScore(userId, score); // Submit score to Firestore for the user
      setShowTryAgain(true);
    }
    setResultMessage("");
  };

  async function submitScore(userId, score) {
    const user = auth.currentUser;
    const userRef = doc(db, "users", userId); // Reference to the user's document in 'users' collection

    try {
      // Create a reference to the 'scores' subcollection for the user
      const scoresRef = collection(userRef, "scores");

      // Add a new document with the score
      await addDoc(scoresRef, {
        score: score,
        timestamp: serverTimestamp(),
      });

      console.log("Score submitted successfully!");
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setResultMessage("");
    setShowTryAgain(false);
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User logged in: ", user);
        setIsLoggedIn(true);
        setUserId(user.uid);
      } else {
        console.log("User logged out");
        setIsLoggedIn(false);
        setUserId(null);
        localStorage.removeItem("loggedInUserId");
      }
    });

    // Checking the localStorage to keep the state after reload
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    if (loggedInUserId) {
      setIsLoggedIn(true);
      setUserId(loggedInUserId);
    }

    return () => unsubscribe();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="App">
      <SketchfabViewer />

      {isLoggedIn ? (
        <div>
          {/* Quiz Question */}
          {currentQuestion && (
            <div id="question-container">
              <h2>{currentQuestion.question}</h2>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered}
                  className="answer-option"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Next Question / Show Score Button */}
          {!showTryAgain ? (
            <button onClick={nextQuestion}>
              {currentQuestionIndex < questions.length - 1
                ? "Next Question"
                : "Show Score"}
            </button>
          ) : (
            <button onClick={restartQuiz}>Take the quiz again</button>
          )}
          {/* Result Message */}
          <p id="resultMessage">{resultMessage}</p>
        </div>
      ) : (
        <div>
          {/* Conditional Rendering for SignUp/SignIn */}
          <div>
            {isSignUp ? (
              <div>
                <h2>Sign Up</h2>
                <form onSubmit={handleSignup}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                  <button type="submit">Sign Up</button>
                </form>
              </div>
            ) : (
              <div>
                <h2>Sign In</h2>
                <form onSubmit={handleSignIn}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                  <button type="submit">Sign In</button>
                </form>
              </div>
            )}

            <button onClick={toggleForm}>
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Messages */}
          <div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            {successMessage && (
              <p style={{ color: "green" }}>{successMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
