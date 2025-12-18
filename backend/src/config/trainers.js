// List of Personal Trainers at Gymnastika
const TRAINERS = [
  { name: 'Mael Chaaya', email: 'maelchaaya5@gmail.com' },
  { name: 'Lolita', email: 'lolitahayek2005@gmail.com' },
  { name: 'Jimmy', email: 'Jimmybm30@gmail.com' },
  { name: 'Cyril', email: 'Cyril.assaad76@gmail.com' },
  { name: 'Cindy', email: 'cindyfadel2018@gmail.com' },
  { name: 'Mohamad Abou Salem', email: 'mba26@mail.aub.edu' },
  { name: 'Mohamad Wehby', email: 'mo20.03dy@gmail.com' },
  { name: 'Mohamed Sabry', email: 'Mohamedsabry3181@gmail.com' },
  { name: 'Charbel Sleiman', email: 'Charbelsleiman517@gmail.com' },
  { name: 'Rayane Karam', email: 'rayanekaram33@gmail.com' },
  { name: 'Mohamad Toukhy', email: 'eltoukhymohamed863@gmail.com' },
  { name: 'Adam Daaboul', email: 'adamdaaboul@gmail.com' },
];

// Helper function to get trainer name by email
function getTrainerName(email) {
  const trainer = TRAINERS.find(t => t.email.toLowerCase() === email.toLowerCase());
  return trainer ? trainer.name : 'Your Coach';
}

module.exports = { TRAINERS, getTrainerName };

