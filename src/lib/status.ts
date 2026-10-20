export interface Schedule {
  days: number[];
  slots: string[][];
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** "Abierto hasta las 00:00" / "Abre hoy 20:15" / "Abre mañana 20:15" según la hora de Argentina. */
export function openStatus(schedule: Schedule[], timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));

  const slotsFor = (d: number) => schedule.filter((s) => s.days.includes(d)).flatMap((s) => s.slots);

  for (const [from, to] of slotsFor(dayIdx)) {
    if (minutes >= toMin(from) && minutes < toMin(to)) {
      return { open: true, text: `Abierto hasta las ${to === '24:00' ? '00:00' : to}` };
    }
  }
  const next = slotsFor(dayIdx).find(([from]) => toMin(from) > minutes);
  if (next) return { open: false, text: `Abre hoy a las ${next[0]}` };
  const tomorrow = slotsFor((dayIdx + 1) % 7)[0];
  return { open: false, text: tomorrow ? `Abre mañana a las ${tomorrow[0]}` : 'Cerrado' };
}
