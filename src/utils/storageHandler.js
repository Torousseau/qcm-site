export const saveAttempt = (score, responses) => {
    const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    const newAttempt = {
        id: Date.now(),
        date: new Date().toISOString(),
        score: score,
        details: responses
    };
    history.push(newAttempt);
    localStorage.setItem('quiz_history', JSON.stringify(history));
};

export const getHistory = () => {
    return JSON.parse(localStorage.getItem('quiz_history') || '[]');
};