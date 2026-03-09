import React, { useState, useEffect, useMemo } from 'react';
import { FaArrowLeftLong, FaPlay, FaPlus, FaLock } from "react-icons/fa6";
import { FaCheck, FaTimes } from "react-icons/fa";
import initialQuestionsData from './storage/questions.json';
import './assets/style/style.css';

const App = () => {
    // --- ÉTATS DE NAVIGATION ---
    const [view, setView] = useState('home'); // 'home', 'quiz', 'admin_auth', 'admin_panel'
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

    // --- ÉTATS ADMIN ---
    const [newOptions, setNewOptions] = useState(["", "", "", ""]);
    const [qType, setQType] = useState("single");
    const [selectedOptions, setSelectedOptions] = useState([]);

    // --- LOGIQUE COMMUNE ---
    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const shuffledQuestions = useMemo(() => {
        if (view === 'admin_panel') return questions;
        return [...questions].sort(() => Math.random() - 0.5);
    }, [questions, view]);

    useEffect(() => {
        if (quizFinished || view !== 'quiz') return;
        if (timer === 0) {
            handleAnswer(qType === 'multiple' ? [] : "Temps écoulé");
            return;
        }
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, quizFinished, view, qType]);

    const saveToDisk = async (data) => {
        try {
            await fetch('http://localhost:3001/save-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast("Synchronisé avec succès ! ✅");
        } catch (err) {
            showToast("Erreur de sauvegarde ❌", "danger");
        }
    };

    const handleAnswer = (selected) => {
        const currentQ = shuffledQuestions[currentIndex];
        let isCorrect = false;

        if (currentQ.type === 'multiple') {
            const correct = Array.isArray(currentQ.correctAnswer) ? currentQ.correctAnswer : [currentQ.correctAnswer];
            isCorrect = correct.length === selected.length && correct.every(v => selected.includes(v));
        } else {
            isCorrect = selected === currentQ.correctAnswer;
        }

        setUserAnswers([...userAnswers, {
            question: currentQ.question,
            selected,
            correct: currentQ.correctAnswer,
            isCorrect
        }]);

        if (currentIndex + 1 < shuffledQuestions.length) {
            setCurrentIndex(currentIndex + 1);
            setTimer(15);
            setSelectedOptions([]);
        } else {
            setQuizFinished(true);
        }
    };

    const addQuestion = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const type = f.get('type');
        const correct = f.get('c');

        const newQ = {
            id: Date.now(),
            question: f.get('q'),
            type: type,
            options: newOptions.map(o => o.trim()),
            correctAnswer: type === 'multiple' ? correct.split(',').map(s => s.trim()) : correct.trim()
        };

        const updated = [...questions, newQ];
        setQuestions(updated);
        localStorage.setItem('quiz_questions', JSON.stringify(updated));
        saveToDisk(updated);
        e.target.reset();
        setNewOptions(["", "", "", ""]);
        showToast("Question ajoutée !");
    };

    // --- RENDU : PAGE D'ACCUEIL ---
    if (view === 'home') {
        return (
            <div className="container home-screen">
                <div className="hero-section">
                    <h1>Quiz Master</h1>
                    <p>Choisissez votre mode pour commencer</p>
                </div>
                <div className="home-grid">
                    <button className="home-card join" onClick={() => setView('quiz')}>
                        <div className="icon-circle"><FaPlay /></div>
                        <span>Rejoindre le Quiz</span>
                    </button>
                    <button className="home-card create" onClick={() => setView('admin_auth')}>
                        <div className="icon-circle"><FaPlus /></div>
                        <span>Espace Admin</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDU : AUTHENTIFICATION ---
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
                    <input
                        type="password"
                        placeholder="Mot de passe..."
                        autoFocus
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkPass()}
                    />
                    <button className="retry-btn" onClick={checkPass}>Se connecter</button>
                </div>
                {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
            </div>
        );
    }

    // --- RENDU : ADMIN PANEL ---
    if (view === 'admin_panel') {
        return (
            <div className="container admin-panel">
                <header className="admin-header">
                    <h2>Admin Panel</h2>
                    <button onClick={() => setView('home')} className="back-button">
                        <FaArrowLeftLong className="icon" /> Quitter
                    </button>
                </header>

                <form onSubmit={addQuestion} className="admin-form">
                    <input name="q" placeholder="Intitulé de la question" required className="main-input"/>
                    <div className="form-row">
                        <select name="type" value={qType} onChange={(e) => setQType(e.target.value)} className="type-select">
                            <option value="single">Choix Unique</option>
                            <option value="multiple">Choix Multiples</option>
                        </select>
                        <button type="button" onClick={() => newOptions.length < 6 && setNewOptions([...newOptions, ""])} className="add-opt-btn">+ Option</button>
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
                    <input name="c" placeholder={qType === 'multiple' ? "Réponses séparées par une virgule" : "Réponse exacte"} required className="correct-input" />
                    <button type="submit" className="retry-btn">Publier la question</button>
                </form>

                <div className="admin-questions-list">
                    <h3>Questions ({questions.length})</h3>
                    {questions.map((q, index) => (
                        <div key={q.id} className="admin-question-card">
                            <div className="admin-card-content">
                                <div className="admin-card-header">
                                    <span className="q-number">#{index + 1}</span>
                                    <span className={`q-type-badge ${q.type}`}>{q.type}</span>
                                </div>
                                <p className="admin-q-text">{q.question}</p>
                                <div className="admin-q-details"><strong>Options:</strong> {q.options.join(' • ')}</div>
                            </div>
                            <button onClick={() => {
                                const up = questions.filter(item => item.id !== q.id);
                                setQuestions(up);
                                localStorage.setItem('quiz_questions', JSON.stringify(up));
                                saveToDisk(up);
                            }} className="admin-del-btn">Supprimer</button>
                        </div>
                    ))}
                </div>
                {notification && <div className={`toast toast-${notification.type}`}>{notification.message}</div>}
            </div>
        );
    }

    // --- RENDU : RÉSULTATS ---
    if (quizFinished) {
        const score = userAnswers.filter(a => a.isCorrect).length;
        const total = shuffledQuestions.length;
        const percentage = Math.round((score / total) * 100);

        return (
            <div className="container results-container">
                <div className="results-header">
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
                </div>

                <div className="correction-list">
                    {userAnswers.map((ans, i) => (
                        <div key={i} className={`correction-card ${ans.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                            <div className="status-icon">{ans.isCorrect ? <FaCheck/> : <FaTimes />}</div>
                            <div className="correction-body">
                                <span className="q-index">Question {i + 1}</span>
                                <p className="q-text">{ans.question}</p>
                                <div className="answer-comparison">
                                    <div className="user-choice">
                                        <small>Ton choix :</small>
                                        <span>{Array.isArray(ans.selected) ? ans.selected.join(', ') : (ans.selected === "Temps écoulé" ? <i>Temps écoulé</i> : ans.selected)}</span>
                                    </div>
                                    {!ans.isCorrect && (
                                        <div className="correct-choice">
                                            <small>La bonne réponse :</small>
                                            <span>{Array.isArray(ans.correct) ? ans.correct.join(', ') : ans.correct}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="retry-btn" onClick={() => window.location.reload()}>Retour Accueil</button>
            </div>
        );
    }

    // --- RENDU : QUIZ ---
    const q = shuffledQuestions[currentIndex];
    const isMultiple = q?.type === 'multiple';

    return (
        <div className="container">
            <header>
                <div className="info">
                    <span className="badge">Question {currentIndex + 1} / {shuffledQuestions.length}</span>
                    <span className={`timer ${timer < 5 ? 'danger' : ''}`}>{timer}s</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}></div></div>
            </header>
            <h2 className="question-text">
                {q?.question}
                {isMultiple && <small className="multiple-hint">(Plusieurs réponses possibles)</small>}
            </h2>
            <div className="options-grid">
                {q?.options.map((opt, i) => {
                    const isSelected = selectedOptions.includes(opt);
                    return (
                        <div key={i} className={`option-card ${isSelected ? 'selected' : ''}`}
                             onClick={() => {
                                 if (!isMultiple) handleAnswer(opt);
                                 else setSelectedOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
                             }}
                        >
                            <div className="option-content">
                                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                <span className="option-text-value">{opt}</span>
                            </div>
                            {isMultiple && (
                                <div className={`multi-indicator ${isSelected ? 'active' : ''}`}>
                                    {isSelected && <span className="check-icon">✓</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {isMultiple && (
                <button className="retry-btn" style={{marginTop: '25px'}} onClick={() => handleAnswer(selectedOptions)} disabled={selectedOptions.length === 0}>
                    Valider la sélection
                </button>
            )}
        </div>
    );
};

export default App;