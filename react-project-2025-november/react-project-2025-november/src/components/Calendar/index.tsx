/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useDispatch } from "react-redux";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";

import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { updateAssignmentDate } from "../../store/schedule/actions";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

type StaffColorMap = Record<string, string>;
type PairHighlight = Record<
  string,
  {
    color: string;
    partnerName: string;
  }
>;

type EventDetail = {
  id: string;
  staffName: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
};

type CustomAssignment = {
  id: string;
  staffId: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
};

type CustomStaff = {
  id: string;
  name: string;
  offDays?: string[];
};

type ShiftChangeRequest = {
  assignmentId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  message: string;
};

type ShiftChangeRequestEntry = ShiftChangeRequest & {
  id: string;
  staffName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type StaffMetrics = {
  totalShifts: number;
  workedHours: number;
  nightShifts: number;
  updatedShifts: number;
};

type ShiftSuggestion = {
  date: string;
  displayDate: string;
  shiftName: string;
  reason: string;
};

const DEFAULT_STATS: StaffMetrics = {
  totalShifts: 0,
  workedHours: 0,
  nightShifts: 0,
  updatedShifts: 0,
};

const STAFF_COLOR_PALETTE = [
  "#0EA5E9",
  "#F97316",
  "#22C55E",
  "#EC4899",
  "#6366F1",
  "#EAB308",
  "#14B8A6",
  "#8B5CF6",
  "#F87171",
  "#3B82F6",
  "#C026D3",
  "#10B981",
];

const clampHex = (value: number) => `00${value.toString(16)}`.slice(-2);

const stringToColor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i += 1) {
    const component = (hash >> (i * 8)) & 0xff;
    color += clampHex(component);
  }
  return color;
};

const getReadableTextColor = (hex: string) => {
  const sanitized = hex.replace("#", "");
  if (sanitized.length < 6) return "#0f172a";

  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#0f172a" : "#ffffff";
};

const buildStaffColorMap = (
  staffs?: Array<{ id: string }>
): StaffColorMap => {
  const map: StaffColorMap = {};
  staffs?.forEach((staff, index) => {
    map[staff.id] = STAFF_COLOR_PALETTE[index % STAFF_COLOR_PALETTE.length];
  });
  return map;
};

const enumeratePairDates = (start: string, end: string): string[] => {
  const startDate = dayjs(start, "DD.MM.YYYY");
  const endDate = dayjs(end, "DD.MM.YYYY");
  if (!startDate.isValid() || !endDate.isValid()) return [];

  const dates: string[] = [];
  let current = startDate;
  while (current.isSame(endDate) || current.isBefore(endDate)) {
    dates.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }
  return dates;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const dispatch = useDispatch<any>();
  const calendarRef = useRef<FullCalendar | null>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>();
  const [initialDate, setInitialDate] = useState<Date>();
  const [offDayDates, setOffDayDates] = useState<Set<string>>(new Set());
  const [pairHighlights, setPairHighlights] = useState<PairHighlight>({});
  const [activeEvent, setActiveEvent] = useState<EventDetail | null>(null);
  const [customAssignments, setCustomAssignments] = useState<CustomAssignment[]>(
    []
  );
  const [customStaff, setCustomStaff] = useState<CustomStaff[]>([]);
  const [hiddenStaffIds, setHiddenStaffIds] = useState<string[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [staffError, setStaffError] = useState("");
  const [customForm, setCustomForm] = useState({
    staffId: "",
    date: "",
    startTime: "",
    endTime: "",
    shiftName: "Özel Vardiya",
  });
  const [shiftRequest, setShiftRequest] = useState<ShiftChangeRequest | null>(
    null
  );
  const [shiftRequestsList, setShiftRequestsList] = useState<
    ShiftChangeRequestEntry[]
  >([]);
  const [staffStats, setStaffStats] = useState<StaffMetrics>(DEFAULT_STATS);
  const [suggestions, setSuggestions] = useState<ShiftSuggestion[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [calendarView, setCalendarView] = useState<
    "dayGridMonth" | "timeGridWeek" | "listWeek"
  >("dayGridMonth");
  const [removedAssignmentIds, setRemovedAssignmentIds] = useState<string[]>(
    []
  );
  const customSeedAppliedRef = useRef(false);

  const visibleScheduleStaffs = useMemo(
    () =>
      schedule?.staffs?.filter(
        (staff) => !hiddenStaffIds.includes(staff.id)
      ) ?? [],
    [hiddenStaffIds, schedule?.staffs]
  );

  const combinedStaffs = useMemo(() => {
    const visibleCustomStaffs = customStaff.filter(
      (staff) => !hiddenStaffIds.includes(staff.id)
    );
    return [...visibleScheduleStaffs, ...visibleCustomStaffs];
  }, [customStaff, hiddenStaffIds, visibleScheduleStaffs]);

  const selectedStaffName =
    combinedStaffs.find((staff) => staff.id === selectedStaffId)?.name ??
    "Personel";

  const staffColorMap = useMemo(
    () => buildStaffColorMap(combinedStaffs),
    [combinedStaffs]
  );

  const calendarViewOptions: Array<{
    label: string;
    value: "dayGridMonth" | "timeGridWeek" | "listWeek";
  }> = [
    { label: "Ay", value: "dayGridMonth" },
    { label: "Hafta", value: "timeGridWeek" },
    { label: "Liste", value: "listWeek" },
  ];

  const canDeleteSelected = selectedEventIds.length > 0;

  const hasSchedule =
    Boolean(schedule?.staffs?.length) && Boolean(schedule?.assignments?.length);

  const hasCalendarData = hasSchedule || Boolean(customAssignments.length);

  const validDates = useMemo(() => {
    if (!schedule?.scheduleStartDate || !schedule?.scheduleEndDate) return [];

    const dates: string[] = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    const endDate = dayjs(schedule.scheduleEndDate);

    while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }
    return dates;
  }, [schedule?.scheduleStartDate, schedule?.scheduleEndDate]);

  const validDateSet = useMemo(() => new Set(validDates), [validDates]);

  useEffect(() => {
    if (schedule?.scheduleStartDate) {
      setInitialDate(dayjs(schedule.scheduleStartDate).toDate());
    }
  }, [schedule?.scheduleStartDate]);

  useEffect(() => {
    if (!calendarRef.current) return;
    calendarRef.current.getApi().changeView(calendarView);
  }, [calendarView]);

  useEffect(() => {
    if (!combinedStaffs.length) return;

    if (
      !selectedStaffId ||
      !combinedStaffs.some((staff) => staff.id === selectedStaffId)
    ) {
      setSelectedStaffId(combinedStaffs[0].id);
    }
  }, [combinedStaffs, selectedStaffId]);

  useEffect(() => {
    setSelectedEventIds([]);
    setMultiSelectMode(false);
  }, [selectedStaffId]);

  useEffect(() => {
    if (
      !schedule?.staffs?.length ||
      customSeedAppliedRef.current ||
      customAssignments.length
    )
      return;

    const tubaStaff = schedule.staffs.find(
      (staff) => staff.name.toLowerCase() === "tuba"
    );
    if (tubaStaff) {
      customSeedAppliedRef.current = true;
      const start = dayjs("2025-10-08T12:30:00").toISOString();
      const end = dayjs("2025-10-08T15:00:00").toISOString();
      setCustomAssignments([
        {
          id: "custom-tuba-oct08",
          staffId: tubaStaff.id,
          shiftName: "Özel Vardiya",
          shiftStart: start,
          shiftEnd: end,
        },
      ]);
    }
  }, [customAssignments.length, schedule?.staffs]);

  useEffect(() => {
    if (!combinedStaffs.length) return;
    setCustomForm((prev) => ({
      ...prev,
      staffId:
        prev.staffId ||
        selectedStaffId ||
        combinedStaffs[0]?.id ||
        prev.staffId,
    }));
  }, [combinedStaffs, selectedStaffId]);

  const getShiftById = useCallback(
    (id: string) => schedule?.shifts?.find((shift) => id === shift.id),
    [schedule?.shifts]
  );

  useEffect(() => {
    if (!selectedStaffId) {
      setEvents([]);
      setStaffStats(DEFAULT_STATS);
      setSuggestions([]);
      setOffDayDates(new Set());
      setPairHighlights({});
      return;
    }

    const scheduleStaff = schedule.staffs?.find(
      (staff) => staff.id === selectedStaffId
    );
    const customStaffMeta = customStaff.find(
      (staff) => staff.id === selectedStaffId
    );

    if (!scheduleStaff && !customStaffMeta) {
      setEvents([]);
      setStaffStats(DEFAULT_STATS);
      setSuggestions([]);
      setOffDayDates(new Set());
      setPairHighlights({});
      return;
    }

    const filteredAssignments =
      scheduleStaff && schedule.assignments
        ? schedule.assignments.filter(
            (assignment) => assignment.staffId === selectedStaffId
          )
        : [];
    const visibleScheduleAssignments = filteredAssignments.filter(
      (assignment) => !removedAssignmentIds.includes(assignment.id)
    );

    const additionalAssignments = customAssignments
      .filter((assignment) => assignment.staffId === selectedStaffId)
      .map((assignment) => ({
        ...assignment,
        shiftId: assignment.shiftName,
        isUpdated: true,
        staffId: assignment.staffId,
        customTitle: assignment.shiftName,
      }));
    const allAssignments = [
      ...visibleScheduleAssignments,
      ...additionalAssignments,
    ];

    if (!allAssignments.length && !scheduleStaff) {
      setEvents([]);
      setStaffStats(DEFAULT_STATS);
      setSuggestions([]);
      setOffDayDates(new Set());
      setPairHighlights({});
      return;
    }

    const staffName =
      scheduleStaff?.name ?? customStaffMeta?.name ?? "Personel";

    const staffEvents = allAssignments.map((assignment) => {
      const shift = getShiftById(assignment.shiftId);
      const start = dayjs(assignment.shiftStart).toDate();
      const end = dayjs(assignment.shiftEnd).toDate();
      const dateKey = dayjs(assignment.shiftStart).format("YYYY-MM-DD");
      const backgroundColor = stringToColor(
        `${assignment.staffId}-${assignment.shiftId}`
      );
      const customTitle = (assignment as { customTitle?: string }).customTitle;
      const eventTitle = customTitle ?? shift?.name ?? "Shift";

      return {
        id: assignment.id,
        title: eventTitle,
        start,
        end,
        allDay: false,
        backgroundColor,
        borderColor: backgroundColor,
        textColor: getReadableTextColor(backgroundColor),
        className: `event ${
          assignment.isUpdated ? "highlight" : ""
        } ${validDateSet.has(dateKey) ? "" : "invalid-date"} ${
          selectedEventIds.includes(assignment.id) ? "selected-event" : ""
        }`,
        extendedProps: {
          staffId: assignment.staffId,
          staffName,
          shiftName: eventTitle,
          shiftStart: assignment.shiftStart,
          shiftEnd: assignment.shiftEnd,
          eventColor: backgroundColor,
        },
      } as EventInput;
    });

    setEvents(staffEvents);

    const offDaySet = new Set(
      (scheduleStaff?.offDays ?? customStaffMeta?.offDays ?? []).map((date) =>
        dayjs(date, "DD.MM.YYYY").format("YYYY-MM-DD")
      )
    );
    setOffDayDates(offDaySet);

    const pairHighlightAccumulator: PairHighlight = {};
    (scheduleStaff?.pairList ?? []).forEach((pair) => {
      enumeratePairDates(pair.startDate, pair.endDate).forEach((dateKey) => {
        const partner =
          schedule.staffs?.find((staff) => staff.id === pair.staffId) ?? null;
        pairHighlightAccumulator[dateKey] = {
          color: staffColorMap[pair.staffId] ?? "#c2068a",
          partnerName: partner?.name ?? "Pair arkadaşı",
        };
      });
    });
    setPairHighlights(pairHighlightAccumulator);

    const workedHours = allAssignments.reduce((sum, assignment) => {
      const start = dayjs(assignment.shiftStart);
      const end = dayjs(assignment.shiftEnd);
      return sum + end.diff(start, "hour", true);
    }, 0);

    const nightShifts = allAssignments.filter((assignment) => {
      const startHour = dayjs(assignment.shiftStart).hour();
      const shift = getShiftById(assignment.shiftId);
      return (
        startHour >= 18 ||
        (shift?.name?.toLowerCase().includes("night") ?? false) ||
        (shift?.shiftRule?.toLowerCase().includes("night") ?? false)
      );
    }).length;

    const updatedShifts = allAssignments.filter(
      (assignment) => assignment.isUpdated
    ).length;

    setStaffStats({
      totalShifts: allAssignments.length,
      workedHours: Number(workedHours.toFixed(1)),
      nightShifts,
      updatedShifts,
    });

    const assignedDateSet = new Set(
      allAssignments.map((assignment) =>
        dayjs(assignment.shiftStart).format("YYYY-MM-DD")
      )
    );

    const availableDates = validDates.filter((date) => {
      if (!validDateSet.has(date)) return false;
      if (assignedDateSet.has(date)) return false;
      if (offDaySet.has(date)) return false;
      return (
        dayjs(date).isSame(dayjs(), "day") ||
        dayjs(date).isAfter(dayjs(), "day")
      );
    });

    const suggestionShifts = schedule?.shifts ?? [];
    const suggestionItems = availableDates.slice(0, 3).map((date, index) => {
      const shift = suggestionShifts[index % suggestionShifts.length];
      return {
        date,
        displayDate: dayjs(date).format("DD MMMM YYYY"),
        shiftName: shift?.name ?? "Önerilen Vardiya",
        reason: shift?.shiftRule
          ? `Kural: ${shift.shiftRule}`
          : "Boş gün bulundu",
      };
    });

    setSuggestions(suggestionItems);
  }, [
    combinedStaffs,
    customAssignments,
    customStaff,
    getShiftById,
    schedule,
    removedAssignmentIds,
    selectedEventIds,
    selectedStaffId,
    staffColorMap,
    validDateSet,
    validDates,
  ]);

  const getPlugins = () => [
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    interactionPlugin,
  ];

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      if (!info.event.start) {
        info.revert();
        return;
      }

      const newDateKey = dayjs(info.event.start).format("YYYY-MM-DD");
      if (!validDateSet.has(newDateKey)) {
        info.revert();
        return;
      }

      const updatedShiftStart = dayjs(info.event.start).toISOString();
      const updatedShiftEnd = dayjs(
        info.event.end ?? info.event.start
      ).toISOString();

      if (info.event.id.startsWith("custom-")) {
        setCustomAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === info.event.id
              ? {
                  ...assignment,
                  shiftStart: updatedShiftStart,
                  shiftEnd: updatedShiftEnd,
                }
              : assignment
          )
        );
        return;
      }

      dispatch(
        updateAssignmentDate({
          assignmentId: info.event.id,
          shiftStart: updatedShiftStart,
          shiftEnd: updatedShiftEnd,
        })
      );
    },
    [dispatch, setCustomAssignments, validDateSet]
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      if (multiSelectMode) {
        setSelectedEventIds((prev) =>
          prev.includes(arg.event.id)
            ? prev.filter((id) => id !== arg.event.id)
            : [...prev, arg.event.id]
        );
        return;
      }

      const start = dayjs(arg.event.extendedProps.shiftStart);
      const end = dayjs(arg.event.extendedProps.shiftEnd);

      setActiveEvent({
        id: arg.event.id,
        staffName: arg.event.extendedProps.staffName,
        shiftName: arg.event.extendedProps.shiftName,
        date: start.format("DD MMMM YYYY"),
        startTime: start.format("HH:mm"),
        endTime: end.format("HH:mm"),
        color: arg.event.extendedProps.eventColor,
      });
      setShiftRequest({
        assignmentId: arg.event.id,
        staffId: arg.event.extendedProps.staffId,
        date: start.format("YYYY-MM-DD"),
        startTime: start.format("HH:mm"),
        endTime: end.format("HH:mm"),
        message: "",
      });
    },
    [multiSelectMode]
  );

  const RenderEventContent = ({ eventInfo }: any) => {
    const startTime = dayjs(eventInfo.event.extendedProps.shiftStart).format(
      "HH:mm"
    );
    const endTime = dayjs(eventInfo.event.extendedProps.shiftEnd).format(
      "HH:mm"
    );

    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
        <span>
          {startTime} - {endTime}
        </span>
      </div>
    );
  };

  const dayCellRenderer = ({ date }: { date: Date }) => {
    const formatted = dayjs(date).format("YYYY-MM-DD");
    const isInRange = validDateSet.has(formatted);
    const isOffDay = offDayDates.has(formatted);
    const pairHighlight = pairHighlights[formatted];

    return (
      <div
        className={`day-cell ${isInRange ? "" : "date-range-disabled"} ${
          isOffDay ? "highlighted-date-orange" : ""
        } ${pairHighlight ? "highlightedPair" : ""}`}
        style={
          pairHighlight
            ? {
                borderBottomColor: pairHighlight.color,
              }
            : undefined
        }
        title={
          pairHighlight
            ? `${pairHighlight.partnerName} ile pair`
            : undefined
        }
      >
        <span>{dayjs(date).date()}</span>
      </div>
    );
  };

  const closeModal = () => {
    setActiveEvent(null);
    setShiftRequest(null);
  };

  const handleCustomFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setCustomForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomAssignment = (event: FormEvent) => {
    event.preventDefault();
    if (!customForm.staffId || !customForm.date) return;
    const start = dayjs(
      `${customForm.date}T${customForm.startTime || "08:00"}`
    ).toISOString();
    const end = dayjs(
      `${customForm.date}T${customForm.endTime || "09:00"}`
    ).toISOString();

    const newAssignment: CustomAssignment = {
      id: `custom-${Date.now()}`,
      staffId: customForm.staffId,
      shiftName: customForm.shiftName || "Özel Vardiya",
      shiftStart: start,
      shiftEnd: end,
    };

    setCustomAssignments((prev) => [...prev, newAssignment]);
    setCustomForm((prev) => ({
      ...prev,
      date: "",
      startTime: "",
      endTime: "",
    }));
  };

  const handleAddCustomStaff = (event: FormEvent) => {
    event.preventDefault();
    const name = newStaffName.trim();
    if (!name) return;
    const normalizedName = name.toLowerCase();
    const activeScheduleStaffs =
      schedule?.staffs?.filter(
        (staff) => !hiddenStaffIds.includes(staff.id)
      ) ?? [];
    const exists =
      combinedStaffs.some(
        (staff) => staff.name.toLowerCase() === normalizedName
      ) ||
      activeScheduleStaffs.some(
        (staff) => staff.name.toLowerCase() === normalizedName
      );
    if (exists) {
      setStaffError("Aynı isimde bir personel zaten mevcut.");
      return;
    }
    setStaffError("");
    const id = `custom-staff-${Date.now()}`;
    setCustomStaff((prev) => [...prev, { id, name }]);
    setNewStaffName("");
    if (!selectedStaffId) setSelectedStaffId(id);
  };

  const handleRemoveStaff = (staffId: string, staffName: string) => {
    const confirmed = window.confirm(
      `${staffName} isimli personeli kaldırmak istediğinizden emin misiniz?`
    );
    if (!confirmed) return;

    if (customStaff.some((staff) => staff.id === staffId)) {
      setCustomStaff((prev) => {
        const updated = prev.filter((staff) => staff.id !== staffId);
        const remaining =
          [
            ...(schedule?.staffs?.filter(
              (staff) => !hiddenStaffIds.includes(staff.id)
            ) ?? []),
            ...updated,
          ].filter((staff) => staff.id !== staffId) ?? [];
        if (staffId === selectedStaffId) {
          setSelectedStaffId(remaining[0]?.id ?? undefined);
        }
        return updated;
      });
      setCustomAssignments((prev) =>
        prev.filter((assignment) => assignment.staffId !== staffId)
      );
    } else {
      setHiddenStaffIds((prev) => {
        const updated = [...new Set([...prev, staffId])];
        if (staffId === selectedStaffId) {
          const remaining =
            [
              ...(schedule?.staffs?.filter(
                (staff) => !updated.includes(staff.id)
              ) ?? []),
              ...customStaff,
            ].filter((staff) => staff.id !== staffId) ?? [];
          setSelectedStaffId(remaining[0]?.id ?? undefined);
        }
        return updated;
      });
    }
  };

  const handleShiftRequestChange = (
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setShiftRequest((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const applyShiftTimeChange = () => {
    if (!shiftRequest) return;
    const newStart = dayjs(`${shiftRequest.date}T${shiftRequest.startTime}`);
    const newEnd = dayjs(`${shiftRequest.date}T${shiftRequest.endTime}`);
    if (!newStart.isValid() || !newEnd.isValid() || !newEnd.isAfter(newStart)) {
      return;
    }

    if (shiftRequest.assignmentId.startsWith("custom-")) {
      setCustomAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === shiftRequest.assignmentId
            ? {
                ...assignment,
                shiftStart: newStart.toISOString(),
                shiftEnd: newEnd.toISOString(),
              }
            : assignment
        )
      );
    } else {
      dispatch(
        updateAssignmentDate({
          assignmentId: shiftRequest.assignmentId,
          shiftStart: newStart.toISOString(),
          shiftEnd: newEnd.toISOString(),
        })
      );
    }

    setActiveEvent((prev) =>
      prev
        ? {
            ...prev,
            date: newStart.format("DD MMMM YYYY"),
            startTime: newStart.format("HH:mm"),
            endTime: newEnd.format("HH:mm"),
          }
        : prev
    );
  };

  const handleSendShiftChangeMail = () => {
    if (!shiftRequest) return;
    const staff =
      combinedStaffs.find((staff) => staff.id === shiftRequest.staffId) ?? null;
    const body = [
      `Personel: ${staff?.name ?? "Bilinmiyor"}`,
      `Tarih: ${dayjs(shiftRequest.date).format("DD MMMM YYYY")}`,
      `Başlangıç: ${shiftRequest.startTime || "-"}`,
      `Bitiş: ${shiftRequest.endTime || "-"}`,
      "",
      shiftRequest.message || "Talep detayı eklenmemiştir.",
    ]
      .map((line) => encodeURIComponent(line))
      .join("%0D%0A");
    const subject = encodeURIComponent("Vardiya Değişiklik Talebi");
    window.location.href = `mailto:hello@smart-maple.com?subject=${subject}&body=${body}`;
  };

  const handleSaveShiftRequest = () => {
    if (!shiftRequest) return;
    const staffName =
      combinedStaffs.find((staff) => staff.id === shiftRequest.staffId)?.name ??
      "Personel";
    const entry: ShiftChangeRequestEntry = {
      ...shiftRequest,
      id: `req-${Date.now()}`,
      staffName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setShiftRequestsList((prev) => [entry, ...prev]);
  };

  const handleUpdateShiftRequestStatus = (
    requestId: string,
    status: ShiftChangeRequestEntry["status"]
  ) => {
    setShiftRequestsList((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  };

  const handleApplySuggestion = (suggestion: ShiftSuggestion) => {
    if (!selectedStaffId) return;
    const referenceShift =
      schedule?.shifts?.find(
        (shift) => shift.name === suggestion.shiftName
      ) ?? schedule?.shifts?.[0];
    const start = dayjs(
      `${suggestion.date}T${referenceShift?.shiftStart ?? "08:00"}`
    ).toISOString();
    const end = dayjs(
      `${suggestion.date}T${referenceShift?.shiftEnd ?? "09:00"}`
    ).toISOString();
    const newAssignment: CustomAssignment = {
      id: `custom-${Date.now()}`,
      staffId: selectedStaffId,
      shiftName: suggestion.shiftName,
      shiftStart: start,
      shiftEnd: end,
    };
    setCustomAssignments((prev) => [...prev, newAssignment]);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    if (assignmentId.startsWith("custom-")) {
      setCustomAssignments((prev) =>
        prev.filter((assignment) => assignment.id !== assignmentId)
      );
    } else {
      setRemovedAssignmentIds((prev) =>
        prev.includes(assignmentId) ? prev : [...prev, assignmentId]
      );
    }
    setSelectedEventIds((prev) =>
      prev.filter((selectedId) => selectedId !== assignmentId)
    );
    if (activeEvent?.id === assignmentId) {
      closeModal();
    }
  };

  const handleDeleteSelectedAssignments = () => {
    if (!selectedEventIds.length) return;
    const customIds = selectedEventIds.filter((id) => id.startsWith("custom-"));
    const scheduleIds = selectedEventIds.filter(
      (id) => !id.startsWith("custom-")
    );

    if (customIds.length) {
      setCustomAssignments((prev) =>
        prev.filter((assignment) => !customIds.includes(assignment.id))
      );
    }
    if (scheduleIds.length) {
      setRemovedAssignmentIds((prev) => [...new Set([...prev, ...scheduleIds])]);
    }
    setSelectedEventIds([]);
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode((prev) => {
      if (prev) setSelectedEventIds([]);
      return !prev;
    });
  };

  const handleDateSelect = useCallback(
    (selection: DateSelectArg) => {
      if (!selectedStaffId) return;
      const newAssignment: CustomAssignment = {
        id: `custom-${Date.now()}`,
        staffId: selectedStaffId,
        shiftName: customForm.shiftName || "Özel Vardiya",
        shiftStart: dayjs(selection.start).toISOString(),
        shiftEnd: dayjs(selection.end ?? selection.start).toISOString(),
      };
      setCustomAssignments((prev) => [...prev, newAssignment]);
      selection.view.calendar.unselect();
    },
    [customForm.shiftName, selectedStaffId]
  );

  const handleViewChange = (view: "dayGridMonth" | "timeGridWeek" | "listWeek") => {
    setCalendarView(view);
  };

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        <div className="staff-list">
          {combinedStaffs.map((staff) => {
            const color = staffColorMap[staff.id] ?? "#19979c";
            const isActive = staff.id === selectedStaffId;
            return (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
                className={`staff ${isActive ? "active" : ""}`}
                style={{
                  borderColor: color,
                  color: isActive ? "#ffffff" : color,
                  backgroundColor: isActive ? color : "#ffffff",
                }}
              >
                <span
                  className="staff-color-indicator"
                  style={{ backgroundColor: color }}
                />
              <span>{staff.name}</span>
                <button
                  type="button"
                  className="staff-remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveStaff(staff.id, staff.name);
                  }}
                  aria-label={`${staff.name} isimli personeli kaldır`}
                >
                  ×
                </button>
            </div>
            );
          })}
        </div>
        <form className="custom-staff-form" onSubmit={handleAddCustomStaff}>
          <label>
            Yeni Personel Adı
            <input
              type="text"
              value={newStaffName}
              onChange={(event) => {
                setNewStaffName(event.target.value);
                if (staffError) setStaffError("");
              }}
              placeholder="Örn. Ayşe Kaya"
            />
          </label>
          <button type="submit">Personel Ekle</button>
          {staffError && <p className="form-error">{staffError}</p>}
        </form>
        <form
          className="custom-assignment-form"
          onSubmit={handleCreateCustomAssignment}
        >
          <h4>Özel Vardiya Oluştur</h4>
          <div className="form-grid">
            <label>
              Personel
              <select
                name="staffId"
                value={customForm.staffId}
                onChange={handleCustomFormChange}
              >
                {combinedStaffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tarih
              <input
                type="date"
                name="date"
                value={customForm.date}
                onChange={handleCustomFormChange}
                required
              />
            </label>
            <label>
              Başlangıç
              <input
                type="time"
                name="startTime"
                value={customForm.startTime}
                onChange={handleCustomFormChange}
                required
              />
            </label>
            <label>
              Bitiş
              <input
                type="time"
                name="endTime"
                value={customForm.endTime}
                onChange={handleCustomFormChange}
                required
              />
            </label>
            <label>
              Vardiya Adı
              <input
                type="text"
                name="shiftName"
                value={customForm.shiftName}
                onChange={handleCustomFormChange}
                placeholder="Özel Vardiya"
              />
            </label>
        </div>
          <button type="submit">Vardiya Ekle</button>
        </form>
        <div className="calendar-controls">
          <div className="view-toggle">
            {calendarViewOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={calendarView === option.value ? "active" : ""}
                onClick={() => handleViewChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="multi-select-toolbar">
            <button
              type="button"
              className={multiSelectMode ? "active" : ""}
              onClick={toggleMultiSelectMode}
            >
              {multiSelectMode ? "Çoklu Seçimi Kapat" : "Çoklu Seçim"}
            </button>
            <button
              type="button"
              disabled={!canDeleteSelected}
              onClick={handleDeleteSelectedAssignments}
            >
              Seçilmiş Vardiyaları Kaldır
            </button>
          </div>
        </div>
        <div className="insights-grid">
          <div className="stats-cards">
            <div className="stat-card">
              <span className="stat-label">Toplam Vardiya</span>
              <strong>{staffStats.totalShifts}</strong>
              <small>{selectedStaffName}</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Toplam Saat</span>
              <strong>{staffStats.workedHours.toFixed(1)}</strong>
              <small>Planlanan süre</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Gece Vardiyası</span>
              <strong>{staffStats.nightShifts}</strong>
              <small>18:00 sonrası</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Güncellenen</span>
              <strong>{staffStats.updatedShifts}</strong>
              <small>Sürükle-bırak sonrası</small>
            </div>
          </div>
          <div className="suggestions-panel">
            <h4>Akıllı Öneriler</h4>
            {suggestions.length ? (
              suggestions.map((suggestion) => (
                <div key={suggestion.date} className="suggestion-item">
                  <div>
                    <strong>{suggestion.displayDate}</strong>
                    <p>{suggestion.shiftName}</p>
                    <small>{suggestion.reason}</small>
                  </div>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      Uygula
                    </button>
                </div>
              ))
            ) : (
              <p>Bu personele özel öneri bulunamadı.</p>
            )}
          </div>
          <div className="requests-panel">
            <h4>Vardiya Talepleri</h4>
            {shiftRequestsList.length ? (
              shiftRequestsList.map((request) => (
                <div key={request.id} className="request-item">
                  <div>
                    <strong>{request.staffName}</strong>
                    <p>
                      {dayjs(request.date).format("DD MMM")} •{" "}
                      {request.startTime} - {request.endTime}
                    </p>
                    <small>{request.message || "Mesaj eklenmedi."}</small>
                  </div>
                  <div className="request-actions">
                    <span className={`status ${request.status}`}>
                      {request.status === "pending"
                        ? "Bekliyor"
                        : request.status === "approved"
                        ? "Onaylandı"
                        : "Reddedildi"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateShiftRequestStatus(request.id, "approved")
                      }
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateShiftRequestStatus(request.id, "rejected")
                      }
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Henüz talep oluşturulmadı.</p>
            )}
          </div>
        </div>
        {hasCalendarData ? (
        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={getPlugins()}
            contentHeight={480}
          handleWindowResize={true}
          selectable={true}
            selectMirror={true}
            select={handleDateSelect}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={true}
          showNonCurrentDates={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          datesSet={(info: any) => {
              if (!schedule?.scheduleStartDate || !schedule?.scheduleEndDate)
                return;

            const prevButton = document.querySelector(
              ".fc-prev-button"
              ) as HTMLButtonElement | null;
            const nextButton = document.querySelector(
              ".fc-next-button"
              ) as HTMLButtonElement | null;

            if (
              calendarRef?.current?.getApi().getDate() &&
                !dayjs(schedule.scheduleStartDate).isSame(
                  calendarRef?.current?.getApi().getDate(),
                  "month"
              )
              ) {
              setInitialDate(calendarRef?.current?.getApi().getDate());
              }

            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
              const endDiff = dayjs(schedule.scheduleEndDate)
                .utc()
                .diff(dayjs(info.end).utc(), "days");
              if (prevButton) prevButton.disabled = startDiff < 0 && startDiff > -35;
              if (nextButton)
                nextButton.disabled = endDiff < 0 && endDiff > -32;
          }}
            dayCellContent={dayCellRenderer}
          />
        ) : (
          <div className="calendar-empty-state">
            <p>Takvim verisi yükleniyor...</p>
          </div>
        )}
      </div>

      {activeEvent && (
        <div className="event-modal-backdrop" onClick={closeModal}>
          <div
            className="event-modal"
            onClick={(event) => event.stopPropagation()}
          >
              <div
              className="event-modal__header"
              style={{ backgroundColor: activeEvent.color }}
            >
              <h4>{activeEvent.shiftName}</h4>
              <button type="button" onClick={closeModal}>
                ×
              </button>
              </div>
            <div className="event-modal__body">
              <p>
                <strong>Personel:</strong> {activeEvent.staffName}
              </p>
              <p>
                <strong>Tarih:</strong> {activeEvent.date}
              </p>
              <p>
                <strong>Başlangıç:</strong> {activeEvent.startTime}
              </p>
              <p>
                <strong>Bitiş:</strong> {activeEvent.endTime}
              </p>
              {shiftRequest && (
                <div className="event-modal__form">
                  <label>
                    Tarih
                    <input
                      type="date"
                      name="date"
                      value={shiftRequest.date}
                      onChange={handleShiftRequestChange}
                    />
                  </label>
                  <label>
                    Başlangıç Saati
                    <input
                      type="time"
                      name="startTime"
                      value={shiftRequest.startTime}
                      onChange={handleShiftRequestChange}
                    />
                  </label>
                  <label>
                    Bitiş Saati
                    <input
                      type="time"
                      name="endTime"
                      value={shiftRequest.endTime}
                      onChange={handleShiftRequestChange}
                    />
                  </label>
                  <label>
                    Mesaj
                    <textarea
                      name="message"
                      rows={3}
                      value={shiftRequest.message}
                      onChange={handleShiftRequestChange}
                      placeholder="Talebi açıklayan kısa bir not bırakın"
                    />
                  </label>
                  <div className="event-modal__form-actions">
                    <button type="button" onClick={applyShiftTimeChange}>
                      Saatleri Güncelle
                    </button>
                    <button type="button" onClick={handleSaveShiftRequest}>
                      Talebi Kaydet
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={handleSendShiftChangeMail}
                    >
                      Talebi Mail ile Gönder
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleRemoveAssignment(activeEvent.id)}
                    >
                      Bu Vardiyayı Kaldır
                    </button>
      </div>
                </div>
              )}
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default CalendarContainer;
