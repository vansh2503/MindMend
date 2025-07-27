import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import axios from "axios";
const base = import.meta.env.VITE_API_BASE_URL;
import {jwtDecode} from "jwt-decode";
import "react-calendar/dist/Calendar.css";

export default function TherapistCalendar() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [therapistId, setTherapistId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const id = decoded.id || decoded._id;
      setTherapistId(id);
    }
  }, []);

  useEffect(() => {
    if (!therapistId) return;

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const [slotRes, apptRes] = await Promise.all([
        axios.get(`${base}/api/bookings/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${base}/api/bookings/my-appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSlots(slotRes.data);
      setAppointments(apptRes.data);
    };

    fetchData();
  }, [therapistId]);

  // const fetchData = async () => {
  //   const token = localStorage.getItem("token");
  //   const decoded = jwtDecode(token);
  //   const id = decoded.id || decoded._id;
  //   setTherapistId(id);
  //   //if (!therapistId) return null;
  //   const [slotRes, apptRes] = await Promise.all([
  //     axios.get("/api/bookings/slots", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }),
  //     axios.get("/api/bookings/my-appointments", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }),
  //   ]);
  //   console.log("slots data", slotRes.data);
  //   console.log(
  //     "Filtered slots",
  //     slots.map((s) => ({ date: s.date, time: s.time, therapist: s.therapist }))
  //   );
  //   setSlots(slotRes.data);
  //   setAppointments(apptRes.data);
  // };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  const formattedDate = selectedDate.toLocaleDateString("en-CA");

  // Slots grouped by date
  const slotMap = slots.reduce((acc, slot) => {
    if (!slot.therapist || slot.therapist._id !== therapistId) return acc;
    const date = new Date(slot.date).toLocaleDateString("en-CA");
    acc[date] = acc[date] || [];
    acc[date].push(slot);
    return acc;
  }, {});

  // Appointments grouped by date
  const apptMap = appointments.reduce((acc, appt) => {
    const date = appt.slot.date;
    acc[date] = acc[date] || [];
    acc[date].push(appt);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">
        🗓 Your Therapist Calendar
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white shadow-xl p-4">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileClassName={({ date }) => {
              const d = date.toLocaleDateString("en-CA");
              if (apptMap[d]) return "bg-purple-300 rounded-full text-white";
              if (slotMap[d]) return "bg-purple-100 rounded-full";
              return "";
            }}
          />
        </div>

        <div className="bg-purple-50 p-4 rounded-xl shadow-xl overflow-y-auto max-h-[500px]">
          <h3 className="text-xl font-semibold text-purple-700 mb-2">
            Details for {formattedDate}
          </h3>

          <div>
            {slotMap[formattedDate] ? (
              slotMap[formattedDate].map((slot) => {
                const bookedAppt = appointments.find(
                  (a) => a.slot._id === slot._id
                );
                return (
                  <div
                    key={slot._id}
                    className="border-b border-purple-200 py-2"
                  >
                    <p className="font-medium">
                      {slot.time} ({slot.duration} mins)
                    </p>
                    {bookedAppt ? (
                      <p className="text-sm text-red-600">
                        Booked by: {bookedAppt.user.name}
                      </p>
                    ) : (
                      <p className="text-sm text-green-600">Available</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 italic">No slots created</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
