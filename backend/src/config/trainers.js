// List of Personal Trainers at Gymnastika
// phone: WhatsApp phone number (with country code, e.g., '96171234567')
// Set phone to null until you have the trainer's WhatsApp number
const TRAINERS = [
  { name: 'Mael Chaaya', email: 'maelchaaya5@gmail.com', phone: '96170803877' },
  { name: 'Lolita', email: 'lolitahayek2005@gmail.com', phone: '96171166483' },
  { name: 'Jimmy', email: 'Jimmybm30@gmail.com', phone: '96176425550' },
  { name: 'Cyril', email: 'Cyril.assaad76@gmail.com', phone: '96176323797' },
  { name: 'Cindy', email: 'cindyfadel2018@gmail.com', phone: '96176770779' },
  { name: 'Mohamad Abou Salem', email: 'mba26@mail.aub.edu', phone: '96176940007' },
  { name: 'Mohamad Wehby', email: 'mo20.03dy@gmail.com', phone: '96181859561' },
  { name: 'Mohamed Sabry', email: 'Mohamedsabry3181@gmail.com', phone: '201005613188' },
  { name: 'Charbel Sleiman', email: 'Charbelsleiman517@gmail.com', phone: '96171654376' },
  { name: 'Rayane Karam', email: 'rayanekaram33@gmail.com', phone: '96176089268' },
  { name: 'Mohamad Toukhy', email: 'eltoukhymohamed863@gmail.com', phone: '201005613188' },
  { name: 'Adam Daaboul', email: 'adamdaaboul@gmail.com', phone: '96170667758' },
];

// Helper function to get trainer name by email
function getTrainerName(email) {
  if (!email) return 'Your Coach';
  const trainer = TRAINERS.find(t => t.email.toLowerCase() === email.toLowerCase());
  return trainer ? trainer.name : 'Your Coach';
}

// Helper function to get trainer phone by email
function getTrainerPhone(email) {
  if (!email) return null;
  const trainer = TRAINERS.find(t => t.email.toLowerCase() === email.toLowerCase());
  return trainer ? trainer.phone : null;
}

// Helper function to get full trainer info by email
function getTrainerByEmail(email) {
  if (!email) return null;
  return TRAINERS.find(t => t.email.toLowerCase() === email.toLowerCase()) || null;
}

module.exports = { TRAINERS, getTrainerName, getTrainerPhone, getTrainerByEmail };
