import React, { useEffect, useState } from "react";
import classNames from "classnames";

const WeekDatePicker = ({ setDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [disablePrev, setDisablePrev] = useState(true);
    const daysToShow = 7;

    useEffect(() => {
        if (selectedDate) {
            const tempDate = selectedDate;
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, "0");
            const day = String(tempDate.getDate()).padStart(2, "0");

            const tempFormattedDate = `${year}-${month}-${day}`;
            setDate(tempFormattedDate);
        }
    }, [selectedDate])

    const getNextSevenDays = () => {
        const nextDates = [];
        let date = new Date(currentDate);

        // Skip to the next Sunday
        while (date.getDay() !== 0) {
            date.setDate(date.getDate() - 1);
        }

        for (let i = 0; i < daysToShow; i++) {
            nextDates.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }

        return nextDates;
    };

    const handlePrevious = () => {
        setCurrentDate((prevDate) => {
            const date = new Date(prevDate);
            date.setDate(date.getDate() - daysToShow);

            const today = new Date();
            const todayWeekStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - today.getDay()
            );

            if (date <= todayWeekStart) {
                setDisablePrev(true);
                return todayWeekStart;
            }
            setDisablePrev(false);
            return date;
        });
    };

    const handleNext = () => {
        setCurrentDate((prevDate) => {
            const date = new Date(prevDate);
            date.setDate(date.getDate() + daysToShow);
            setDisablePrev(false);
            return date;
        });
    };

    const renderDate = (date) => {
        const options = { weekday: "long", month: "short", day: "numeric" };
        return date.toLocaleDateString("en-US", options);
    };

    const nextDates = getNextSevenDays();

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <button
                    className={`p-2 flex flex-row items-center ${disablePrev ? 'text-gray-500 cursor-not-allowed' : 'text-blue-700'}`}
                    onClick={handlePrevious}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>

                    Previous
                </button>
                <button
                    className="p-2 flex flex-row items-center text-blue-700"
                    onClick={handleNext}
                >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>

                </button>
            </div>
            <div className="flex space-x-4">
                {nextDates.map((date) => (
                    <div
                        onClick={() => setSelectedDate(date)}
                        key={date}
                        className={classNames(
                            "p-2 rounded-lg shadow-md text-center text-black cursor-pointer",
                            {
                                "bg-gray-200 hover:cursor-not-allowed text-gray-400": date.getDay() === 0 || date.getDay() === 6 || date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0), // Disable selection for Sunday, Saturday, and previous dates
                                "bg-blue-500  text-white": date.toDateString() === selectedDate.toDateString(), // Highlight the current date
                            }
                        )}
                    >
                        <div className="font-bold">{renderDate(date)}</div>
                        <div>{date.toLocaleDateString("en-US", { weekday: "long" })}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeekDatePicker;
