import { all, get } from '../db/db.js'

// Get all events
export function getAllEvents(){
  return all('SELECT * FROM events')
}

// Get event by ID
export function getEventById(id){
  return get('SELECT * FROM events WHERE id = ?', [id]);
}

// Get events by type
export function getEventsByType(type){
  return all('SELECT * FROM events WHERE type = ?', [type])
}

// Get a random event based on probability
export function getRandomEvent() {
  const events = getAllEvents();
  const rand = Math.random();
  let cumulative = 0;

  for (const event of events) {
    cumulative += event.probability;
    if (rand <= cumulative) {
      return event;
    }
  }

  // Fallback to last event (should rarely happen)
  return events[events.length - 1];
}
