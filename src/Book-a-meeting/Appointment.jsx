import React, { useEffect, useState } from "react";
import Select from 'react-select';
import moment from 'moment';
import 'moment-timezone';
import WeekDatePicker from "./weekDatePicker";


function Appointment() {
    const [duration, setDuration] = useState(30);
    const [time, setTime] = useState('12:00');
    const [fullName, setFullName] = useState('');
    const [userContact, setUserContact] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [submit, setSubmit] = useState(false);
    const [loading, setLoading] = useState(true);

    const tempDate = new Date();
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const day = String(tempDate.getDate()).padStart(2, "0");

    const tempFormattedDate = `${year}-${month}-${day}`;

    const [meetingDate, setMeetingDate] = useState(tempFormattedDate);


    const [formErrors, setFormErrors] = useState({ fullName: '', userEmail: '', duration: '', time: '', date: '' });

    const [timeZone, setTimeZone] = useState('Asia/Kolkata');

    const [availableTimes, setAvailableTimes] = useState([]);
    const [tempAvailableTimes, setTempAvailableTime] = useState([]);

    const handleDurationChange = () => {

        if (duration === 30) {
            // Generate available times with 30-minute gap from 9 to 21
            const times = [];
            let hour = 9;
            let minutes = 0;

            while (hour < 21) {
                times.push(`${hour}:${minutes.toString().padStart(2, "0")}`);
                minutes += 30;

                if (minutes === 60) {
                    hour++;
                    minutes = 0;
                }
            }
            console.log(times);
            setTempAvailableTime(times);
        } else if (duration === 60) {
            // Generate available times with 60-minute gap from 9 to 21
            const times = [];
            let hour = 9;

            while (hour < 21) {
                times.push(`${hour}:00`);
                hour++;
            }
            console.log(times);

            setTempAvailableTime(times);
        } else {
            setTempAvailableTime([]);
        }
    };

    useEffect(() => {
        if (duration) {
            handleDurationChange()
        }
    }, [duration])


    const validateForm = () => {
        let isValid = true;
        const errors = {};

        if (!fullName.trim()) {
            errors.fullName = 'Full name is required';
            isValid = false;
        }
        if (!userContact) {
            errors.usercontact = 'Phone Number is required';
            isValid = false;
        }

        if (!userEmail.trim()) {
            errors.userEmail = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(userEmail)) {
            errors.userEmail = 'Email is invalid';
            isValid = false;
        }


        setFormErrors(errors);
        return isValid;
    }


    const acquireAccessToken = async () => {
        const url = 'http://65.0.85.20:8080/get-access-token';
        try {
            const res = await fetch(url, {
                method: "GET"
            })
            const access_token = await res.json();
            return (access_token.access_token);
        }
        catch (err) {
            console.log(err);
        }
    };

    // ...

    async function fetchCalendarEvents(date) {
        const accessToken = await acquireAccessToken();
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        const startDateTime = moment.tz(date, 'Asia/Kolkata').startOf('day').toISOString();
        const endDateTime = moment.tz(date, 'Asia/Kolkata').endOf('day').toISOString();

        const url = `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            const data = await response.json();
            console.log(data);
            return data.value;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            return [];
        }
    }

    const handleMeetingDateChange = async (date) => {

        const events = await fetchCalendarEvents(date);
        const busyTimes = events.map((event) => {
            const eventStart = moment.utc(event.start.dateTime).tz('Asia/Kolkata');
            const eventEnd = moment.utc(event.end.dateTime).tz('Asia/Kolkata');

            const durationMinutes = eventEnd.diff(eventStart, 'minutes');
            return {
                start: eventStart,
                end: eventEnd,
                duration: durationMinutes
            };
        });

        console.log("Bussy Time: ",busyTimes);

        const availableTimesList = [];
        const currentTime = moment(new Date())
            let hour = 9;
            let minutes = 0;

            while (hour < 21) {
                const time = `${hour}:${minutes.toString().padStart(2, '0')}`;
                const selectedStartTime = moment(`${date}T${time}:00`, 'YYYY-MM-DDTHH:mm:ss');
                const selectedEndTime = selectedStartTime.clone().add(duration, 'minutes');

                // console.log(selectedStartTime, selectedEndTime);

                const isTimeAvailable = busyTimes.every((busyTime) => {
                    const busyStartTime = moment(busyTime.start, 'HH:mm');
                    const busyEndTime = moment(busyTime.end, 'HH:mm');
                    // console.log(busyStartTime, busyEndTime);

                    return !(
                        selectedStartTime.isSameOrBefore(currentTime) ||
                        (selectedStartTime.isSameOrAfter(busyStartTime) && selectedStartTime.isBefore(busyEndTime)) ||
                        (selectedEndTime.isAfter(busyStartTime) && selectedEndTime.isSameOrBefore(busyEndTime)) ||
                        (busyStartTime.isSameOrAfter(selectedStartTime) && busyEndTime.isSameOrBefore(selectedEndTime))
                    );
                });

                const isFutureTime = !selectedStartTime.isSameOrBefore(currentTime);
                
                if (isTimeAvailable && isFutureTime) {
                    availableTimesList.push(time);
                }

                if(duration === 30){

                    minutes += 30;
                    
                    if (minutes === 60) {
                        hour++;
                        minutes = 0;
                    }
                }
                else if (duration === 60) {
                    hour++;   
                }
            }
            
        console.log(availableTimesList);
        setAvailableTimes(availableTimesList);
    };


    // ...
    useEffect(() => {
        if (meetingDate) {
            handleMeetingDateChange(meetingDate);
        }
    }, [meetingDate,tempAvailableTimes])

    async function createCalendarEvent(email, name, date, time, duration) {
        const eventSubject = `Online Meeting with Yash Mittal (Project Manager)`;
        const meetingStart = moment.tz(`${date}T${time}:00`, 'Asia/Kolkata').toISOString();
        const meetingEnd = moment(meetingStart).add(duration, 'minutes').toISOString();

        const accessToken = await acquireAccessToken();
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        // Create online meeting
        const onlineMeetingBody = {
            startDateTime: new Date(meetingStart).toISOString(),
            endDateTime: new Date(meetingEnd).toISOString(),
            subject: eventSubject,
        };

        const onlineMeetingResponse = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(onlineMeetingBody)
        });
        const onlineMeetingData = await onlineMeetingResponse.json();
        const onlineMeetingId = onlineMeetingData.id;
        const htmlContent = `
        <h1 style="color: #008080; font-size: 24px;">Meeting with Yash Mittal (Project Manager)</h1>
        <p>Hello <b style="color: #ff0000;">${fullName}</b>, thank you for showing interest with Nikola Charging.</p>
        <p>Please give your confirmation by clicking "YES" on the meeting invite above.</p>
        <p>Please find meeting details attached below this email.</p>
        <p></p>
        <h2 style="color: #000000; font-size: 18px;">Your Information:</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Contact:</b> ${userContact}</p>
        <p></p>
        <p style="font-style: italic;">Sincerely,</p>
        <p><b style="color: #0000ff;">Nikola Charging Team</b></p>
        `;
        // Create calendar event
        const body = {
            subject: eventSubject,
            body: {
                contentType: 'HTML',
                content: htmlContent
            },
            start: {
                dateTime: meetingStart,
                timeZone: 'Asia/Kolkata'
            },
            end: {
                dateTime: meetingEnd,
                timeZone: 'Asia/Kolkata'
            },
            attendees: [
                {
                    emailAddress: {
                        address: email
                    },
                    type: 'required'
                },
                {
                    emailAddress: {
                        address: 'ymittal@nikolacharging.in',
                        name: 'Yash Mittal'
                    },
                    type: 'required'
                }
            ],
            organizer: {
                emailAddress: {
                    address: 'ymittal@nikolacharging.in',
                    name: 'Yash Mittal'
                }
            },
            allowNewTimeProposals: true,
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness',
            onlineMeeting: {
                conferenceId: onlineMeetingId
            }
        };

        fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
            .then(response => {
                if (response.status === 201) {
                    console.log('Event created successfully');
                    setLoading(false);
                } else {
                    throw new Error(`Error creating event: ${response.status} ${response.statusText}`);
                }
            })
            .catch(error => {
                console.error('Error creating event:', error);
            });
    }


    const sendInvite = () => {
        if (validateForm()) {
            setSubmit(true);
            const Email = userEmail;
            const Name = fullName;
            const Date = meetingDate;
            const Time = time;
            const Duration = duration; // Duration in minutes

            createCalendarEvent(Email, Name, Date, Time, Duration);
        }
    }

    function createDropdownOptions() {
        const timeZones = moment.tz.names().map((tz) => {
            return { value: tz, label: tz };
        });

        const options = timeZones.map((tz) => {
            const option = document.createElement('option');
            option.value = tz.value;
            option.text = tz.label;
            return option;
        });

        return options;
    }

    const getConvertedTime = (time) => {
        const originalTime = moment.tz(time, 'HH:mm', 'Asia/Kolkata');
        const convertedTime = originalTime.clone().tz(timeZone);
        const formattedTime = convertedTime.format('hh:mm A');

        return (formattedTime);
    }


    return (
        <div className="relative">
            <div className="w-screen">
                <div className="relative mx-auto mt-20  max-w-screen-lg overflow-hidden rounded-t-xl bg-emerald-400/60 py-32 text-center shadow-xl shadow-gray-300">
                    <h1 className="mt-2 px-8 text-3xl font-bold text-white md:text-5xl">Book a Meeting</h1>
                    <p className="mt-6 text-lg text-white">Get an appointment with our experts</p>
                    <img className="absolute top-0 left-0 -z-10 h-full w-full object-cover" src="https://images.unsplash.com/photo-1504672281656-e4981d70414b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" alt="" />
                </div>

                <div className="mx-auto grid max-w-screen-lg px-6 rounded-lg mb-20 pt-20 pb-20 bg-teal-50">
                    <div className="">
                        <p className="font-serif text-xl font-bold text-blue-900">Select meeting duration</p>
                        <div className="mt-4 grid max-w-3xl gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                            {/* <div className="relative my-auto">
                                <input className="peer hidden" id="radio_1" type="radio" name="radio" value={15} checked={duration == 15} onChange={(e) => setDuration(e.target.value)} />
                                <span className="absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 border-gray-300 bg-white peer-checked:border-emerald-400"></span>
                                <label className="flex h-full cursor-pointer flex-col rounded-lg p-4 shadow-xl shadow-slate-950 peer-checked:bg-teal-900 peer-checked:text-white" htmlFor="radio_1">
                                    <span className=" font-medium">15 Minutes</span>
                                </label>
                            </div> */}
                            <div className="relative my-auto">
                                <input className="peer hidden" id="radio_2" type="radio" name="radio" value={30} checked={duration == 30} onChange={(e) => setDuration(30)} />
                                <span className="absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 border-gray-300 bg-white peer-checked:border-emerald-400"></span>

                                <label className="flex h-full cursor-pointer flex-col rounded-lg p-4 shadow-xl shadow-slate-950 peer-checked:bg-teal-900 peer-checked:text-white" htmlFor="radio_2">
                                    <span className=" font-medium">30 Minutes</span>
                                </label>
                            </div>
                            <div className="relative my-auto">
                                <input className="peer hidden" id="radio_3" type="radio" name="radio" value={60} checked={duration == 60} onChange={(e) => setDuration(60)} />
                                <span className="absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 border-gray-300 bg-white peer-checked:border-emerald-400"></span>

                                <label className="flex h-full cursor-pointer flex-col rounded-lg p-4 shadow-xl shadow-slate-950 peer-checked:bg-teal-900 peer-checked:text-white" htmlFor="radio_3">
                                    <span className=" font-medium">1 Hour</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* <div className="">
                        <p className="mt-8 font-serif text-xl font-bold text-blue-900">Select a date</p>
                        <div className="relative mt-4 w-72 rounded-lg shadow-xl shadow-slate-950">
                            <Datepicker
                                useRange={false}
                                asSingle={true}
                                value={value}
                                onChange={handleValueChange}
                                minDate={moment().subtract(1, 'day').toDate()}
                            />
                        </div>
                        {formErrors.date && <p className="text-red-500">{formErrors.date}</p>}
                    </div> */}

                    <div className="">
                        <p className="mt-8 font-serif text-xl font-bold text-blue-900">Select a date</p>
                        <WeekDatePicker setDate={setMeetingDate} />
                        {formErrors.date && <p className="text-red-500">{formErrors.date}</p>}
                    </div>

                    <div className="">
                        <div className="">
                            <p className="mt-8 font-serif text-xl font-bold text-blue-900">Select a time zone</p>
                            <Select
                                options={createDropdownOptions()}
                                value={{ value: timeZone, label: timeZone }}
                                onChange={(selectedOption) => setTimeZone(selectedOption.value)}
                            />
                        </div>
                        <p className="mt-8 font-serif text-xl font-bold text-blue-900">Select a time</p>
                        <div className="mt-4 grid grid-cols-4 gap-2 w-full">
                            {/* {
                                availableTimes.map((time) => (
                                    <button onClick={() => setTime(time)} className={`rounded-lg shadow-xl ${time == '11:00' ? 'bg-teal-900 text-white' : 'bg-white text-black'} shadow-slate-950 px-4 py-2 font-medium text-emerald-900 active:scale-95`}>{time}</button>
                                ))
                            } */}
                            <Select
                                options={[...availableTimes.map((time) => ({ value: time, label: getConvertedTime(time) }))]}
                                onChange={(selectedOption) => setTime(selectedOption.value)}

                            />
                        </div>
                    </div>

                    <div className="relative mt-10">
                        <label htmlFor="name" className="mt-8 font-serif text-xl font-bold text-blue-900">Name</label>
                        <input type="text" id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} name="name" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                        {formErrors.fullName && <p className="text-red-500">{formErrors.fullName}</p>}
                    </div>
                    <div className="relative mt-10">
                        <label htmlFor="name" className="mt-8 font-serif text-xl font-bold text-blue-900">Phone Number</label>
                        <input type="text" id="name" value={userContact} onChange={(e) => setUserContact(e.target.value)} name="name" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                        {formErrors.usercontact && <p className="text-red-500">{formErrors.usercontact}</p>}
                    </div>
                    <div className="relative mt-10">
                        <label htmlFor="email" className="mt-8 font-serif text-xl font-bold text-blue-900">Email</label>
                        <input type="email" id="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} name="email" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                        {formErrors.userEmail && <p className="text-red-500">{formErrors.userEmail}</p>}
                    </div>
                    <button
                        onClick={sendInvite}
                        className="mt-8 w-56 rounded-full border-8 border-teal-500 bg-teal-900 px-10 py-4 text-lg font-bold text-white transition hover:translate-y-1">Book Now</button>
                </div>
            </div>

            {
                submit ? (
                    <div class="flex items-center justify-center h-screen fixed w-full top-0 left-0 z-10 bg-opacity-50 backdrop-filter bg-black backdrop-blur">
                        <div class="p-1 rounded shadow-lg bg-gradient-to-r from-purple-500 via-green-500 to-blue-500">
                            <div class="flex flex-col items-center p-4 space-y-2 bg-white">
                                <div class={`circle-loader mt-4 ${!loading ? 'load-complete' : ''}`} >
                                    <div class={`checkmark draw ${loading ? 'hidden' : ''}`}></div>
                                </div>
                                {
                                    loading ? (
                                        <h1 class="text-4xl py-12 px-8 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Setting Up Meeting...</h1>
                                    ) : (
                                        <div className="space-y-4 flex items-center flex-col">
                                            <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Meeting Booked!</h1>
                                            <p>Thank you for your interest! Check your email for a meeting invitation.</p>
                                            <a href="http://nikolacharging.in/"
                                                class="inline-flex items-center px-4 py-2 text-white bg-indigo-600 border border-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring">
                                                <span class="text-sm font-medium">
                                                    Nikolacharging.in
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 ml-2 rotate-180" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                                </svg>
                                            </a>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                ) : (
                    <></>
                )
            }


        </div>
    )
}

export default Appointment