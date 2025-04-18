const io = require('socket.io')();
const { Users } = require('./models');

// Store socket IDs for users
const userSockets = {};

// Initialize socket server
const initializeSocket = (server) => {
    io.attach(server);

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user login event to store the socket ID
        socket.on('userLoggedIn', (user) => {
            console.log('\nuser role: ', user.role)
            if (user.role === 'admin') {
                userSockets[user.id] = socket.id;  // Store socket ID for the admin
                console.log(`Admin ${user.id} connected with socket id: ${socket.id}`);
            }
        });

        // Handle disconnection of users
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Remove socket from the userSockets map when disconnected
            for (const userId in userSockets) {
                if (userSockets[userId] === socket.id) {
                    delete userSockets[userId];
                    break;
                }
            }
        });
    });
};
const notifyAdmins = async (event, data) => {
    try {
        // Fetch admin users from the database
        const admins = await Users.findAll({ where: {role: 'admin'}, });
        console.log()
        // Emit the event to each admin user
        admins.forEach(admin => {
            const adminSocketId = userSockets[admin.id];  // Get admin's socket ID
            if (adminSocketId) {
                io.to(adminSocketId).emit(event, data);  // Emit to admin socket
                console.log(`Notification sent to Admin ${admin.id} with socket id ${adminSocketId}`);
            } else {
                console.log(`Admin ${admin.id} does not have a connected socket.`);
            }
        });
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};


// Export io and userSockets so they can be used in other files
module.exports = { io, initializeSocket, notifyAdmins, userSockets };





// const io = require('socket.io')();  // Initialize Socket.IO server
// const { Users } = require('./models');  // Your User model

// const userSockets = {};  // This will store socket IDs for users (admins)

// const initializeSocket = (server) => {
//     io.attach(server);

//     io.on('connection', (socket) => {
//         console.log('User connected:', socket.id);

//         // Store socket ID when admin logs in (or connects)
//         socket.on('userLoggedIn', async (user) => {
//             if (user.role === 'Admin') {
//                 userSockets[user.id] = socket.id;  // Store the socket ID for admin
//                 console.log(`Admin ${user.id} connected with socket id: ${socket.id}`);
//             }
//         });

//         // Handle disconnection of users
//         socket.on('disconnect', () => {
//             console.log('User disconnected:', socket.id);
//             // Remove socket from the userSockets map when disconnected
//             for (const userId in userSockets) {
//                 if (userSockets[userId] === socket.id) {
//                     delete userSockets[userId];
//                     break;
//                 }
//             }
//         });
//     });
// };

// // Notify Admins about new booking creation
// const notifyAdmins = async (event, data) => {
//     try {
//         // Fetch admin users from the database
//         const admins = await Users.findAll({ where: { role: 'admin' } });

//         // Emit the event to each admin user
//         admins.forEach(admin => {
//             const adminSocketId = userSockets[admin.id];  // Get admin's socket ID
//             if (adminSocketId) {
//                 console.log(`Sending notification to admin ${admin.id} with socket id: ${adminSocketId}`);
//                 io.to(adminSocketId).emit(event, data);  // Emit to admin socket
//             } else {
//                 console.log(`Admin ${admin.id} does not have a connected socket.`);
//             }
//         });
//     } catch (error) {
//         console.error('Error notifying admins:', error);
//     }
// };

// module.exports = { io, initializeSocket, notifyAdmins };
