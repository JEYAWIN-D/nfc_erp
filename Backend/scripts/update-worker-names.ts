import prisma from '../src/config/prisma';

const REAL_WORKER_NAMES = [
  { first: 'Ravi', last: 'Kumar' },
  { first: 'Priya', last: 'Sharma' },
  { first: 'Suresh', last: 'Babu' },
  { first: 'Meena', last: 'Raj' },
  { first: 'Arjun', last: 'Singh' },
  { first: 'Lakshmi', last: 'Nair' },
  { first: 'Ganesh', last: 'Murthy' },
  { first: 'Kavitha', last: 'Krishnan' },
  { first: 'Dinesh', last: 'Pandey' },
  { first: 'Anitha', last: 'Subramanian' },
  { first: 'Manoj', last: 'Kumar' },
  { first: 'Deepa', last: 'Sundaram' },
  { first: 'Ramesh', last: 'Verma' },
  { first: 'Sunita', last: 'Reddy' },
  { first: 'Karthik', last: 'Raja' },
  { first: 'Divya', last: 'Lakshmi' },
  { first: 'Arul', last: 'Dass' },
  { first: 'Meenakshi', last: 'Sundaram' },
  { first: 'Vijay', last: 'Kumar' },
  { first: 'Lakshmanan', last: 'Pillai' },
  { first: 'Saravanan', last: 'Iyer' },
  { first: 'Yamuna', last: 'Devi' },
  { first: 'Harish', last: 'Chandra' },
  { first: 'Rekha', last: 'Gupta' },
  { first: 'Sathish', last: 'Kumar' },
  { first: 'Vimala', last: 'Rani' },
  { first: 'Ashok', last: 'Venkatesh' },
  { first: 'Bhuvaneshwari', last: 'Natarajan' },
  { first: 'Chitra', last: 'Devi' },
  { first: 'Dharmendra', last: 'Yadav' },
  { first: 'Ezhil', last: 'Arasan' },
  { first: 'Fatima', last: 'Beevi' },
  { first: 'Gokul', last: 'Nath' },
  { first: 'Hemalatha', last: 'Sekar' },
  { first: 'Indrajith', last: 'Sen' },
  { first: 'Jayanthi', last: 'Mani' },
  { first: 'Kowsalya', last: 'Kannan' },
  { first: 'Loganathan', last: 'Pillai' },
  { first: 'Mohanraj', last: 'Bose' },
  { first: 'Nithya', last: 'Shree' },
  { first: 'Om', last: 'Prakash' },
  { first: 'Padmavathi', last: 'Rao' },
  { first: 'Raghuraman', last: 'Swamy' },
  { first: 'Sangeetha', last: 'Varadhan' },
  { first: 'Thirunavukkarasu', last: 'Mudaliar' },
  { first: 'Uma', last: 'Maheshwari' },
  { first: 'Venkatesh', last: 'Prabhu' },
  { first: 'Yashoda', last: 'Nandan' },
  { first: 'Zahir', last: 'Hussain' },
  { first: 'Aakash', last: 'Chowdhury' },
  { first: 'Bhavani', last: 'Shankar' },
  { first: 'Charumathi', last: 'Sundar' },
  { first: 'Deepak', last: 'Patil' },
  { first: 'Elango', last: 'Kannan' },
  { first: 'Farida', last: 'Begum' },
  { first: 'Gita', last: 'Govind' },
  { first: 'Hariharan', last: 'Subramaniam' },
  { first: 'Ishwarya', last: 'Rai' },
  { first: 'Jagadeesh', last: 'Prasad' },
  { first: 'Kalyani', last: 'Deshmukh' },
  { first: 'Lokesh', last: 'Sharma' },
  { first: 'Mythili', last: 'Vaidyanathan' },
  { first: 'Naveen', last: 'Pattanaik' },
  { first: 'Oviya', last: 'Helen' },
  { first: 'Pavithra', last: 'Srinivasan' },
  { first: 'Qadir', last: 'Ahmed' },
  { first: 'Radhika', last: 'Apte' },
  { first: 'Subash', last: 'Chandra' },
  { first: 'Tamil', last: 'Selvan' },
  { first: 'Udaya', last: 'Kumar' },
  { first: 'Vaishnavi', last: 'Ganesh' },
  { first: 'Wasim', last: 'Akram' },
  { first: 'Xavier', last: 'Fernandez' },
  { first: 'Yuvan', last: 'Shankar' },
  { first: 'Zoya', last: 'Akhtar' },
  { first: 'Abhinav', last: 'Bindra' },
  { first: 'Bharath', last: 'Raja' },
  { first: 'Chandrasekar', last: 'Raman' },
  { first: 'Dharani', last: 'Devi' },
  { first: 'Elavarasan', last: 'Perumal' },
  { first: 'Gajendra', last: 'Verma' },
  { first: 'Hemant', last: 'Karsan' },
  { first: 'Iniyan', last: 'Sundar' },
  { first: 'Janani', last: 'Iyer' },
  { first: 'Kannan', last: 'Viswanathan' },
  { first: 'Lavanya', last: 'Tripathi' },
  { first: 'Muthu', last: 'Vel' },
  { first: 'Nirmal', last: 'Baba' },
  { first: 'Poornima', last: 'Ramanathan' },
  { first: 'Rajesh', last: 'Khanna' },
  { first: 'Subramani', last: 'Reddy' },
  { first: 'Thangavelu', last: 'Mariapan' },
  { first: 'Urmila', last: 'Matondkar' },
  { first: 'Velmurugan', last: 'Selvam' },
  { first: 'Yamini', last: 'Krishnamurthy' },
  { first: 'Zeena', last: 'Unnikrishnan' }
];

async function updateWorkerNames() {
  console.log('🔄 Starting worker names update script...');
  
  const workers = await prisma.worker.findMany({
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${workers.length} workers in database.`);

  let updatedCount = 0;
  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    const nameObj = REAL_WORKER_NAMES[i % REAL_WORKER_NAMES.length];

    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        firstName: nameObj.first,
        lastName: nameObj.last
      }
    });
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} worker records with unique real names!`);
}

updateWorkerNames()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
