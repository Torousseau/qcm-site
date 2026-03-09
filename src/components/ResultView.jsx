export const ResultView = ({ responses, questions, onRestart }) => {
    const score = responses.filter(r => r.isCorrect).length;

    return (
        <div className="results-container">
            <h2>Résultats du Test 📝</h2>
            <p className="final-score">Score : {score} / {questions.length}</p>

            <div className="review-section">
                {questions.map((q, index) => {
                    const userResp = responses.find(r => r.questionId === q.id);
                    return (
                        <div key={q.id} className={`review-card ${userResp.isCorrect ? 'correct' : 'wrong'}`}>
                            <p><strong>Q{index + 1}: {q.question}</strong></p>
                            <p>Votre réponse : {userResp.userChoice}</p>
                            {!userResp.isCorrect && (
                                <p className="correction">Correction : {q.correctAnswer}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            <button className="restart-btn" onClick={onRestart}>Recommencer le Quiz</button>
        </div>
    );
};