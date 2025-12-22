// List of Personal Trainers at Gymnastika
// phone: WhatsApp phone number (with country code, e.g., '96171234567')
// Set phone to null until you have the trainer's WhatsApp number
const TRAINERS = [
  { name: 'Mael Chaaya', email: 'maelchaaya5@gmail.com', phone: null },
  { name: 'Lolita', email: 'lolitahayek2005@gmail.com', phone: null },
  { name: 'Jimmy', email: 'Jimmybm30@gmail.com', phone: null },
  { name: 'Cyril', email: 'Cyril.assaad76@gmail.com', phone: null },
  { name: 'Cindy', email: 'cindyfadel2018@gmail.com', phone: null },
  { name: 'Mohamad Abou Salem', email: 'mba26@mail.aub.edu', phone: null },
  { name: 'Mohamad Wehby', email: 'mo20.03dy@gmail.com', phone: null },
  { name: 'Mohamed Sabry', email: 'Mohamedsabry3181@gmail.com', phone: null },
  { name: 'Charbel Sleiman', email: 'Charbelsleiman517@gmail.com', phone: null },
  { name: 'Rayane Karam', email: 'rayanekaram33@gmail.com', phone: null },
  { name: 'Mohamad Toukhy', email: 'eltoukhymohamed863@gmail.com', phone: null },
  { name: 'Adam Daaboul', email: 'adamdaaboul@gmail.com', phone: null },
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
