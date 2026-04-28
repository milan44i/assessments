import { useEffect, useState } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Label } from '../../components/Label';
import { format } from 'date-fns';
import { Calendar, Clock, User, X } from 'lucide-react';

const initialFormData = {
  doctor: '',
  appointmentDate: '',
  appointmentTime: '',
  reason: '',
  symptoms: '',
};

const validate = (values) => {
  const errors = {};

  if (!values.doctor) {
    errors.doctor = 'Please select a doctor';
  }

  if (!values.appointmentDate) {
    errors.appointmentDate = 'Date is required';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(values.appointmentDate);
    selected.setHours(0, 0, 0, 0);
    if (selected.getTime() <= today.getTime()) {
      errors.appointmentDate = 'Date must be in the future';
    }
  }

  if (!values.appointmentTime) {
    errors.appointmentTime = 'Time is required';
  } else if (values.appointmentTime < '09:00' || values.appointmentTime > '17:00') {
    errors.appointmentTime = 'Time must be between 9:00 AM and 5:00 PM';
  }

  if (!values.reason || values.reason.trim().length < 10) {
    errors.reason = 'Reason must be at least 10 characters';
  }

  return errors;
};

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [touched, setTouched] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const errors = validate(formData);
  const isValid = Object.keys(errors).length === 0;

  const fieldClass = (field, base = '') => {
    const showError = touched[field] && errors[field];
    return `${base}${showError ? ' border-red-500 focus-visible:ring-red-500' : ''}`;
  };

  const markTouched = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { appointments: data } = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { users } = await userService.getAll({ role: 'doctor' });
      setDoctors(users);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      doctor: true,
      appointmentDate: true,
      appointmentTime: true,
      reason: true,
    });
    if (!isValid) return;

    try {
      await appointmentService.create(formData);
      setShowForm(false);
      setFormData(initialFormData);
      setTouched({});
      setSubmitSuccess(true);
      window.setTimeout(() => setSubmitSuccess(false), 4000);
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create appointment');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.update(id, { status: 'cancelled' });
        fetchAppointments();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-2">Manage your medical appointments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          Book Appointment
        </Button>
      </div>

      {submitSuccess && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700"
        >
          Appointment booked successfully.
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Book New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <select
                    id="doctor"
                    className={fieldClass(
                      'doctor',
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    )}
                    value={formData.doctor}
                    onChange={(e) => {
                      setFormData({ ...formData, doctor: e.target.value });
                      markTouched('doctor');
                    }}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                      </option>
                    ))}
                  </select>
                  {touched.doctor && errors.doctor && (
                    <p className="text-sm text-red-600">{errors.doctor}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    className={fieldClass('appointmentDate')}
                    value={formData.appointmentDate}
                    onChange={(e) => {
                      setFormData({ ...formData, appointmentDate: e.target.value });
                      markTouched('appointmentDate');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {touched.appointmentDate && errors.appointmentDate && (
                    <p className="text-sm text-red-600">{errors.appointmentDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    className={fieldClass('appointmentTime')}
                    value={formData.appointmentTime}
                    onChange={(e) => {
                      setFormData({ ...formData, appointmentTime: e.target.value });
                      markTouched('appointmentTime');
                    }}
                    min="09:00"
                    max="17:00"
                  />
                  {touched.appointmentTime && errors.appointmentTime && (
                    <p className="text-sm text-red-600">{errors.appointmentTime}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    className={fieldClass('reason')}
                    value={formData.reason}
                    onChange={(e) => {
                      setFormData({ ...formData, reason: e.target.value });
                      markTouched('reason');
                    }}
                    placeholder="Brief reason for visit (min. 10 characters)"
                  />
                  {touched.reason && errors.reason && (
                    <p className="text-sm text-red-600">{errors.reason}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                <textarea
                  id="symptoms"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Describe your symptoms..."
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Book Appointment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTouched({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        Dr. {appointment.doctor?.name}
                      </span>
                      {appointment.doctor?.specialization && (
                        <span className="text-sm text-muted-foreground">
                          - {appointment.doctor.specialization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm">{appointment.reason}</p>
                    )}
                    {appointment.symptoms && (
                      <p className="text-sm text-muted-foreground">
                        Symptoms: {appointment.symptoms}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appointment._id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

