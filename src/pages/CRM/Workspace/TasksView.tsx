import React, { useState, useEffect } from 'react';
import { Clock, GripVertical, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    format,
    addDays,
    addWeeks,
    addMonths,
    subDays,
    subWeeks,
    subMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    setHours,
    setMinutes
} from 'date-fns';
import { TaskModal } from './TaskModal';

interface Task {
    id: string;
    title: string;
    duration: number; // in minutes
    status: 'unscheduled' | 'scheduled';
    scheduledTime?: {
        start: Date;
        allDay?: boolean;
    };
}

const MOCK_TASKS: Task[] = [
    { id: '1', title: 'Call Jason regarding invoice', duration: 30, status: 'unscheduled' },
    { id: '2', title: 'Prepare Q3 Report', duration: 60, status: 'unscheduled' },
    { id: '3', title: 'Update client details', duration: 15, status: 'unscheduled' },
    { id: '4', title: 'Send follow-up email', duration: 15, status: 'unscheduled' },
    { id: '5', title: 'Review contract draft', duration: 45, status: 'unscheduled' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR); // 6am to 10pm

interface TasksViewProps {
    initialView?: 'day' | 'week' | 'month';
}

export const TasksView: React.FC<TasksViewProps> = ({ initialView = 'week' }) => {
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
    const [view, setView] = useState<'day' | 'week' | 'month'>(initialView);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, setDraggedTask] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTask(taskId);
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleWeekDrop = (e: React.DragEvent, dayDate: Date, hour: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newStart = setMinutes(setHours(new Date(dayDate), hour), 0);
                return {
                    ...t,
                    status: 'scheduled',
                    scheduledTime: { start: newStart, allDay: false }
                };
            }
            return t;
        }));
        setDraggedTask(null);
    };

    const handleMonthDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                // Preserve existing time if possible, otherwise default to 9am
                let newStart = new Date(date);
                const currentStart = t.scheduledTime?.start;
                if (currentStart) {
                    newStart = setMinutes(setHours(newStart, currentStart.getHours()), currentStart.getMinutes());
                } else {
                    newStart = setMinutes(setHours(newStart, 9), 0);
                }

                return {
                    ...t,
                    status: 'scheduled',
                    scheduledTime: { start: newStart, allDay: true } // Treat as all-day for month view drop context usually
                };
            }
            return t;
        }));
        setDraggedTask(null);
    };

    const handleUnscheduleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: 'unscheduled',
                    scheduledTime: undefined
                };
            }
            return t;
        }));
        setDraggedTask(null);
    };

    const handleAddTask = () => {
        setEditingTask(null); // Creating new task
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (data: { title: string; duration: number }) => {
        if (editingTask) {
            // Update existing task
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
        } else {
            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: data.title,
                duration: data.duration,
                status: 'unscheduled'
            };
            setTasks(prev => [...prev, newTask]);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handlePrev = () => {
        if (view === 'day') setCurrentDate(d => subDays(d, 1));
        else if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
        else if (view === 'month') setCurrentDate(d => subMonths(d, 1));
    };

    const handleNext = () => {
        if (view === 'day') setCurrentDate(d => addDays(d, 1));
        else if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
        else if (view === 'month') setCurrentDate(d => addMonths(d, 1));
    };

    const handleDateClick = (date: Date) => {
        setCurrentDate(date);
        setView('day');
    };

    const renderTasksForSlot = (slotTasks: Task[], limit: number, isMonthView: boolean = false, isDayView: boolean = false) => {
        let effectiveLimit = limit;
        if (isDayView && slotTasks.length > limit) {
            effectiveLimit = limit - 1;
        }

        const visibleTasks = slotTasks.slice(0, effectiveLimit);
        const hiddenCount = slotTasks.length - effectiveLimit;

        if (isDayView) {
            return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(2, 1fr)',
                    gap: '4px',
                    height: '100%',
                    padding: '2px'
                }}>
                    {visibleTasks.map((task) => (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            style={{
                                height: '100%',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '4px',
                                padding: '0 8px',
                                cursor: 'grab',
                                fontSize: '11px',
                                color: '#1E40AF',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: 0
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                            }}
                            onMouseEnter={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '0';
                            }}
                        >
                            <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{task.title}</div>
                            <div style={{ fontSize: '9px', opacity: 0.8, marginLeft: '4px' }}>{task.duration}m</div>
                            <button
                                className="delete-btn-cal"
                                onClick={(e) => handleDeleteTask(e, task.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#EF4444',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    padding: '2px',
                                    marginLeft: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                    {hiddenCount > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '100%',
                            fontSize: '10px',
                            color: '#64748B',
                            background: '#F1F5F9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}>
                            +{hiddenCount}
                        </div>
                    )}
                </div>
            );
        }

        if (isMonthView) {
            const monthLimit = 5;
            const visibleMonthTasks = slotTasks.slice(0, monthLimit);
            const hiddenMonthCount = slotTasks.length - monthLimit;

            return (
                <>
                    {visibleMonthTasks.map((task) => (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            style={{
                                height: '18px', // Reduced height
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '3px',
                                padding: '0 4px', // Reduced padding
                                cursor: 'grab',
                                fontSize: '10px', // Reduced font size
                                color: '#1E40AF',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '1px', // Reduced margin
                                position: 'relative'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                            }}
                            onMouseEnter={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '0';
                            }}
                        >
                            <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{task.title}</div>
                            <button
                                className="delete-btn-cal"
                                onClick={(e) => handleDeleteTask(e, task.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#EF4444',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    padding: '0 2px',
                                    marginLeft: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                    {hiddenMonthCount > 0 && (
                        <div style={{
                            fontSize: '10px',
                            color: '#64748B',
                            textAlign: 'center',
                            background: '#F1F5F9',
                            borderRadius: '3px',
                            padding: '1px 0',
                            cursor: 'pointer',
                            marginTop: '1px'
                        }}>
                            +{hiddenMonthCount} more
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                {visibleTasks.map((task, index) => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        style={{
                            position: 'absolute',
                            top: `${2 + (index * 22)}px`,
                            left: '2px',
                            right: '2px',
                            height: '20px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '4px',
                            padding: '0 8px',
                            cursor: 'grab',
                            fontSize: '11px',
                            color: '#1E40AF',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 1
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                        }}
                        onMouseEnter={(e) => {
                            const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                            if (deleteBtn) deleteBtn.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            const deleteBtn = e.currentTarget.querySelector('.delete-btn-cal') as HTMLElement;
                            if (deleteBtn) deleteBtn.style.opacity = '0';
                        }}
                    >
                        <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{task.title}</div>
                        <div style={{ fontSize: '9px', opacity: 0.8, marginLeft: '4px' }}>{task.duration}m</div>
                        <button
                            className="delete-btn-cal"
                            onClick={(e) => handleDeleteTask(e, task.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#EF4444',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                padding: '2px',
                                marginLeft: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                ))}
                {hiddenCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: `${2 + (limit * 22)}px`,
                        left: '2px',
                        right: '2px',
                        fontSize: '10px',
                        color: '#64748B',
                        textAlign: 'center',
                        background: '#F1F5F9',
                        borderRadius: '4px',
                        padding: '1px 0',
                        cursor: 'pointer'
                    }}>
                        +{hiddenCount} more
                    </div>
                )}
            </>
        );
    };

    const renderCurrentTimeIndicator = () => {
        const now = currentTime;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (currentHour < START_HOUR || currentHour > END_HOUR) return null;

        const hourHeight = 60; // Height of one hour block in Day View (Updated)
        // Calculate position relative to the start of the grid
        // We need to find the offset from the top of the first hour block (START_HOUR)
        const totalMinutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute;
        const topPosition = (totalMinutesFromStart / 60) * hourHeight;

        return (
            <div
                style={{
                    position: 'absolute',
                    top: `${topPosition}px`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#EF4444',
                    zIndex: 20,
                    pointerEvents: 'none'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '-5px',
                        top: '-4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#EF4444'
                    }}
                />
            </div>
        );
    };

    const weekDates = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });

    const monthGrid = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    });

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Task List (Left Column) */}
            <div
                style={{
                    width: '250px',
                    borderRight: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#F8FAFC'
                }}
                onDragOver={handleDragOver}
                onDrop={handleUnscheduleDrop}
            >
                <div style={{
                    height: '56px', // Fixed height for alignment
                    padding: '0 16px', // Horizontal padding only, vertical handled by flex alignment
                    borderBottom: '1px solid #E2E8F0',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box'
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', margin: 0 }}>Unscheduled Tasks</h3>
                    <button
                        onClick={handleAddTask}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#3B82F6',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks.filter(t => t.status === 'unscheduled').map(task => (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            style={{
                                background: 'white',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                cursor: 'grab',
                                userSelect: 'none',
                                position: 'relative'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                            }}
                            onMouseEnter={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                if (deleteBtn) deleteBtn.style.opacity = '0';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <GripVertical size={14} color="#94A3B8" />
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{task.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '22px' }}>
                                <Clock size={12} color="#64748B" />
                                <span style={{ fontSize: '11px', color: '#64748B' }}>{task.duration} min</span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDeleteTask(e, task.id)}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#EF4444',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    padding: '4px'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {tasks.filter(t => t.status === 'unscheduled').length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '20px' }}>
                            No unscheduled tasks
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar View (Right Column) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header Controls */}
                <div style={{
                    height: '56px', // Fixed height for alignment
                    padding: '0 16px', // Horizontal padding only
                    borderBottom: '1px solid #E2E8F0',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: 0 }}>
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={handlePrev} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer' }}><ChevronLeft size={16} color="#64748B" /></button>
                            <button onClick={handleNext} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer' }}><ChevronRight size={16} color="#64748B" /></button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '6px' }}>
                        <button
                            onClick={() => setView('day')}
                            style={{
                                padding: '4px 10px', // Reduced padding
                                borderRadius: '4px',
                                border: 'none',
                                background: view === 'day' ? 'white' : 'transparent',
                                color: view === 'day' ? '#1E293B' : '#64748B',
                                fontWeight: '500',
                                fontSize: '12px', // Slightly smaller font
                                cursor: 'pointer',
                                boxShadow: view === 'day' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setView('week')}
                            style={{
                                padding: '4px 10px', // Reduced padding
                                borderRadius: '4px',
                                border: 'none',
                                background: view === 'week' ? 'white' : 'transparent',
                                color: view === 'week' ? '#1E293B' : '#64748B',
                                fontWeight: '500',
                                fontSize: '12px', // Slightly smaller font
                                cursor: 'pointer',
                                boxShadow: view === 'week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            style={{
                                padding: '4px 10px', // Reduced padding
                                borderRadius: '4px',
                                border: 'none',
                                background: view === 'month' ? 'white' : 'transparent',
                                color: view === 'month' ? '#1E293B' : '#64748B',
                                fontWeight: '500',
                                fontSize: '12px', // Slightly smaller font
                                cursor: 'pointer',
                                boxShadow: view === 'month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Month
                        </button>
                    </div>
                </div>

                {view === 'day' ? (
                    /* Day View */
                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {/* Day Header - Sticky */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div style={{ width: '60px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', boxSizing: 'border-box', flexShrink: 0 }}></div>
                            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRight: '1px solid #E2E8F0', minWidth: 0 }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: isToday(currentDate) ? '#3B82F6' : '#64748B', marginBottom: '4px' }}>
                                    {format(currentDate, 'EEEE').toUpperCase()}
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isToday(currentDate) ? '#3B82F6' : 'transparent',
                                    color: isToday(currentDate) ? 'white' : '#1E293B',
                                    fontSize: '18px',
                                    fontWeight: '600'
                                }}>
                                    {format(currentDate, 'd')}
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            {/* Red Current Time Indicator */}
                            {isToday(currentDate) && renderCurrentTimeIndicator()}

                            {HOURS.map(hour => (
                                <div key={hour} style={{ display: 'flex', height: '60px', borderBottom: '1px solid #F1F5F9' }}> {/* Reduced height for Day View */}
                                    {/* Time Label */}
                                    <div style={{
                                        width: '60px',
                                        padding: '8px',
                                        textAlign: 'right',
                                        fontSize: '11px',
                                        color: '#94A3B8',
                                        borderRight: '1px solid #E2E8F0',
                                        background: '#F8FAFC',
                                        boxSizing: 'border-box',
                                        flexShrink: 0
                                    }}>
                                        {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                    </div>

                                    {/* Day Column (Monday - Index 0) */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleWeekDrop(e, currentDate, hour)}
                                        style={{
                                            flex: 1,
                                            borderRight: '1px solid #F1F5F9',
                                            position: 'relative',
                                            background: 'white',
                                            minWidth: 0
                                        }}
                                    >
                                        {renderTasksForSlot(
                                            tasks.filter(t => t.status === 'scheduled' && t.scheduledTime?.start && isSameDay(t.scheduledTime.start, currentDate) && t.scheduledTime.start.getHours() === hour),
                                            8, // Limit 8 for Day View (4x2 grid)
                                            false, // isMonthView
                                            true // isDayView
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : view === 'week' ? (
                    /* Week View */
                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {/* Days Header - Sticky */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div style={{ width: '60px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', boxSizing: 'border-box', flexShrink: 0 }}></div>
                            {weekDates.map((date, index) => (
                                <div
                                    key={index}
                                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRight: '1px solid #E2E8F0', minWidth: 0, cursor: 'pointer' }}
                                    onClick={() => handleDateClick(date)}
                                >
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: isToday(date) ? '#3B82F6' : '#64748B', marginBottom: '4px' }}>
                                        {format(date, 'EEE').toUpperCase()}
                                    </div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: isToday(date) ? '#3B82F6' : 'transparent',
                                        color: isToday(date) ? 'white' : '#1E293B',
                                        fontSize: '18px',
                                        fontWeight: '600'
                                    }}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {HOURS.map(hour => (
                                <div key={hour} style={{ display: 'flex', height: '60px', borderBottom: '1px solid #F1F5F9' }}> {/* Reduced height for Week View */}
                                    {/* Time Label */}
                                    <div style={{
                                        width: '60px',
                                        padding: '8px',
                                        textAlign: 'right',
                                        fontSize: '11px',
                                        color: '#94A3B8',
                                        borderRight: '1px solid #E2E8F0',
                                        background: '#F8FAFC',
                                        boxSizing: 'border-box',
                                        flexShrink: 0
                                    }}>
                                        {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                    </div>

                                    {/* Day Columns */}
                                    {weekDates.map((dayDate, dayIndex) => (
                                        <div
                                            key={`${dayIndex}-${hour}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleWeekDrop(e, dayDate, hour)}
                                            style={{
                                                flex: 1,
                                                borderRight: '1px solid #F1F5F9',
                                                position: 'relative',
                                                background: 'white',
                                                minWidth: 0,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleDateClick(dayDate)}
                                        >
                                            {renderTasksForSlot(
                                                tasks.filter(t => t.status === 'scheduled' && t.scheduledTime?.start && isSameDay(t.scheduledTime.start, dayDate) && t.scheduledTime.start.getHours() === hour),
                                                2 // Limit 2 for Week View
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Month View */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Days Header */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            {DAYS.map(day => (
                                <div key={day} style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Month Grid */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${monthGrid.length / 7}, 1fr)`, overflow: 'auto' }}>
                            {monthGrid.map((date, index) => {
                                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                const isCurrentDay = isToday(date);

                                return (
                                    <div
                                        key={index}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleMonthDrop(e, date)}
                                        onClick={() => handleDateClick(date)}
                                        style={{
                                            borderRight: '1px solid #F1F5F9',
                                            borderBottom: '1px solid #F1F5F9',
                                            padding: '8px',
                                            position: 'relative',
                                            background: isCurrentMonth ? 'white' : '#F8FAFC',
                                            minHeight: '140px', // Increased height to fit 5 tasks + indicator
                                            minWidth: 0, // Fix for resizing issue
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: isCurrentDay ? 'white' : isCurrentMonth ? '#1E293B' : '#94A3B8',
                                            marginBottom: '8px',
                                            background: isCurrentDay ? '#3B82F6' : 'transparent',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {format(date, 'd')}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {renderTasksForSlot(
                                                tasks.filter(t => t.status === 'scheduled' && t.scheduledTime?.start && isSameDay(t.scheduledTime.start, date)),
                                                5, // Limit 5 for Month View
                                                true // isMonthView
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                initialData={editingTask ? { title: editingTask.title, duration: editingTask.duration } : null}
            />
        </div>
    );
};
