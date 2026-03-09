import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaArrowLeftLong, FaPlay, FaPlus, FaLock } from "react-icons/fa6";
import { FaCheck, FaTimes } from "react-icons/fa";
import initialQuestionsData from './storage/questions.json';
import './assets/style/style.css';

const App = () => {
    const [view, setView] = useState('home');
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const MASTER_PASSWORD = "P@ssw0rd";

    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem('quiz_questions');
        return saved ? JSON.parse(saved) : initialQuestionsData;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [timer, setTimer] = useState(15);
    const [notification, setNotification] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState([]);

    const [newOptions, setNewOptions] = useState(["", "", "", ""]);
    const [qType, setQType] = useState("single");

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const shuffledData = useMemo(() => {
        if (view !== 'quiz') return questions;
        return [...questions]
            .sort(() => Math.random() - 0.5)
            .map(q => ({
                ...q,
                options: [...q.options].sort(() => Math.random() - 0.5)
            }));
    }, [questions, view]);

    const handleAnswer = useCallback((selected) => {
        const currentQ = shuffledData[currentIndex];
        if (!currentQ) return;

        let isCorrect = false;
        const normalize = (str) => String(str).trim().toLowerCase();

        if (currentQ.type === 'multiple') {
            const userSelection = Array.isArray(selected) ? selected.map(normalize) : [];
            const correctAnswers = Array.isArray(currentQ.correctAnswer)
                ? currentQ.correctAnswer.map(normalize)
                : [normalize(currentQ.correctAnswer)];
            isCorrect = userSelection.length === correctAnswers.length &&
                userSelection.every(val => correctAnswers.includes(val));
        } else {
            const finalChoice = Array.isArray(selected) ? selected[0] : selected;
            const correctSingle = Array.isArray(currentQ.correctAnswer)
                ? normalize(currentQ.correctAnswer[0])
                : normalize(currentQ.correctAnswer);
            isCorrect = normalize(finalChoice) === correctSingle;
        }

        setUserAnswers(prev => [...prev, {
            question: currentQ.question,
            selected,
            correct: currentQ.correctAnswer,
            isCorrect
        }]);

        if (currentIndex + 1 < shuffledData.length) {
            setCurrentIndex(prev => prev + 1);
            setTimer(15);
            setSelectedOptions([]);
        } else {
            setQuizFinished(true);
        }
    }, [currentIndex, shuffledData]);

    useEffect(() => {
        if (quizFinished || view !== 'quiz') return;
        if (timer === 0) {
            handleAnswer(selectedOptions.length > 0 ? selectedOptions : "Temps écoulé");
            return;
        }
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, quizFinished, view, handleAnswer, selectedOptions]);

    const saveToDisk = async (data) => {
        try {
            await fetch('http://localhost:3001/save-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast("Synchronisé avec succès ! ✅");
        } catch (err) {
            console.warn("Serveur local non détecté.");
        }
    };

    const addQuestion = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const type = f.get('type');
        const correctRaw = f.get('c');
        const newQ = {
            id: Date.now(),
            question: f.get('q'),
            type: type,
            options: newOptions.map(o => o.trim()),
            correctAnswer: type === 'multiple'
                ? correctRaw.split(',').map(s => s.trim())
                : correctRaw.trim()
        };
        const updated = [...questions, newQ];
        setQuestions(updated);
        localStorage.setItem('quiz_questions', JSON.stringify(updated));
        saveToDisk(updated);
        e.target.reset();
        setNewOptions(["", "", "", ""]);
        showToast("Question ajoutée !");
    };

    if (view === 'home') {
        return (
            <div className="container home-screen">
                <div className="hero-section">
                    <h1>Quiz Master</h1>
                    <p>Prêt à tester vos connaissances ?</p>
                </div>
                <div className="home-grid">
                    <button className="home-card join" onClick={() => { setView('quiz'); setCurrentIndex(0); setUserAnswers([]); setQuizFinished(false); setTimer(15); setSelectedOptions([]); }}>
                        <div className="icon-circle"><FaPlay /></div>
                        <span>Rejoindre le Quiz</span>
                    </button>
                    {/*<button className="home-card create" onClick={() => setView('admin_auth')}>*/}
                    {/*    <div className="icon-circle"><FaPlus /></div>*/}
                    {/*    <span>Espace Admin</span>*/}
                    {/*</button>*/}
                </div>
            </div>
        );
    }

    if (view === 'admin_auth') {
        const checkPass = () => {
            if (adminPasswordInput === MASTER_PASSWORD) setView('admin_panel');
            else showToast("Mot de passe incorrect", "danger");
        };
        return (
            <div className="container auth-screen">
                <button className="back-link" onClick={() => setView('home')}><FaArrowLeftLong /> Retour</button>
                <div className="auth-card">
                    <FaLock className="lock-icon" />
                    <h2>Accès Restreint</h2>
                    <input type="password" placeholder="Mot de passe..." autoFocus value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkPass()} />
                    <button className="retry-btn" onClick={checkPass}>Se connecter</button>
                </div>
                {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
            </div>
        );
    }

    if (view === 'admin_panel') {
        return (
            <div className="container admin-panel">
                <header className="admin-header">
                    <h2>Admin Panel</h2>
                    <button onClick={() => setView('home')} className="back-button"><FaArrowLeftLong /> Quitter</button>
                </header>
                <form onSubmit={addQuestion} className="admin-form">
                    <input name="q" placeholder="Intitulé de la question" required className="main-input"/>
                    <div className="form-row">
                        <select name="type" value={qType} onChange={(e) => setQType(e.target.value)} className="type-select">
                            <option value="single">Choix Unique</option>
                            <option value="multiple">Choix Multiples</option>
                        </select>
                        <button type="button" onClick={() => setNewOptions([...newOptions, ""])} className="add-opt-btn" disabled={newOptions.length >= 6}>+ Option</button>
                    </div>
                    <div className="dynamic-options-grid">
                        {newOptions.map((opt, i) => (
                            <div key={i} className="option-field">
                                <input value={opt} onChange={(e) => {
                                    const up = [...newOptions];
                                    up[i] = e.target.value;
                                    setNewOptions(up);
                                }} placeholder={`Option ${i+1}`} required />
                                {newOptions.length > 2 && <button type="button" onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))} className="remove-btn"><FaTimes/></button>}
                            </div>
                        ))}
                    </div>
                    <input name="c" placeholder={qType === 'multiple' ? "Réponses (ex: HTML, CSS)" : "Réponse exacte"} required className="correct-input" />
                    <button type="submit" className="retry-btn">Publier</button>
                </form>
                {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
            </div>
        );
    }

    if (quizFinished) {
        const score = userAnswers.filter(a => a.isCorrect).length;
        const total = userAnswers.length;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        return (
            <div className="container results-container">
                <div className="score-circle-wrapper">
                    <svg viewBox="0 0 36 36" className="score-ring">
                        <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="ring-fill" strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="score-text">
                        <span className="percentage">{percentage}%</span>
                        <span className="raw-score">{score} / {total}</span>
                    </div>
                </div>
                <div className="correction-list">
                    {userAnswers.map((ans, i) => (
                        <div key={i} className={`correction-card ${ans.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                            <div className="status-icon">{ans.isCorrect ? <FaCheck/> : <FaTimes />}</div>
                            <div className="correction-body">
                                <p className="q-text">{ans.question}</p>
                                <div className="answer-comparison">
                                    <div className="answer-item user">
                                        <span className="answer-label">Ton choix</span>
                                        <span className="answer-val">{Array.isArray(ans.selected) ? ans.selected.join(', ') : ans.selected}</span>
                                    </div>
                                    {!ans.isCorrect && (
                                        <div className="answer-item correct">
                                            <span className="answer-label">Correct</span>
                                            <span className="answer-val">{Array.isArray(ans.correct) ? ans.correct.join(', ') : ans.correct}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="retry-btn" onClick={() => setView('home')}>Retour Accueil</button>
            </div>
        );
    }

    const q = shuffledData[currentIndex];
    if (!q) return null;

    return (
        <div className="container">
            <header>
                <div className="info">
                    <span className="badge">Q {currentIndex + 1} / {shuffledData.length}</span>
                    <span className={`timer ${timer < 5 ? 'danger' : ''}`}>{timer}s</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${((currentIndex + 1) / shuffledData.length) * 100}%` }}></div></div>
            </header>
            <h2 className="question-text">
                {q.question}
                {q.type === 'multiple' && <small className="multiple-hint"> (Plusieurs choix possibles)</small>}
            </h2>
            <div className="options-grid">
                {q.options.map((opt, i) => {
                    const isSelected = selectedOptions.includes(opt);
                    return (
                        <div key={i} className={`option-card ${isSelected ? 'selected' : ''}`}
                             onClick={() => {
                                 if (q.type === 'single') {
                                     setSelectedOptions([opt]);
                                 } else {
                                     setSelectedOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
                                 }
                             }}>
                            <div className="option-content">
                                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                <span className="option-text-value">{opt}</span>
                            </div>
                            <div className={`multi-indicator ${isSelected ? 'active' : ''}`}>{isSelected && <FaCheck/>}</div>
                        </div>
                    );
                })}
            </div>
            <button className="retry-btn" style={{marginTop: '25px'}}
                    onClick={() => handleAnswer(q.type === 'single' ? selectedOptions[0] : selectedOptions)}
                    disabled={selectedOptions.length === 0}>
                Valider la réponse
            </button>
        </div>
    );
};

export default App;