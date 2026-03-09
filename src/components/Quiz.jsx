import { useState } from 'react';
import questionsData from '../storage/questions.json';

export default function Quiz() {
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (selectedOption) => {
        if (selectedOption === questionsData[currentStep].correctAnswer) {
            setScore(score + 1);
        }

        const nextStep = currentStep + 1;
        if (nextStep < questionsData.length) {
            setCurrentStep(nextStep);
        } else {
            setShowResult(true);
        }
    };

    if (showResult) {
        return <h2>Votre score : {score} / {questionsData.length}</h2>;
    }

    return (
        <div>
            <h3>{questionsData[currentStep].question}</h3>
            {questionsData[currentStep].options.map((opt) => (
                <button key={opt} onClick={() => handleAnswer(opt)}>
                    {opt}
                </button>
            ))}
        </div>
    );
}