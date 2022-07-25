# Beyond-Sports
Assignment
Assignment Document Features
Beyond Sports

Name Ahmed Elemary
Duration of Completion 4 days
Data 25/07/2022 
GitHub link: https://github.com/Osled/Beyond-Sports

Functionalities
Data Collection
Match Control
Camera Control

Highlights
Data Collection: Script allows to collect of the Given Data file with Formate .dat. The script splits the data to be able to be collected and used in other external scripts. 
Match Contol: Running the Data as a simulation in Unity that can be controlled based on the position and the frame of all Objects. 
Camera Control: Using a combination of Conemamachine and Unity base Cameras. Allow the user to move,  control, and switch the cameras. 
Future Implementations
Animations Connected with the Dataset to offer better visualization of the match. 
Better Camera movement. 
Smooth Match Run time.
Add textures, Materials, and 3D models to represent humanoid players.

Data collection



Approach
Split the Data.
Store the Data provided by the Data Sheet.
Apply data to Objects

Information
Split the data:  using KeyValuePair. To read the data using unity and define which part of the data relates to the following category  (Frame, Team, TrackingID,  PlayerNumber X-Position, Speed). 
Store the data:  To use the data, they must be stored.  Some data like position had to be scaled down, due to the massive use of space.  
Apply data to objects: If the teams don’t exist, then instantiate new players, set the teams, and assign the position, team color, and name based on the player number.
Future Implementations
Assign more information to the ball and the player. 








Match Replay Control



Approach
Object simulation
Playback Control
Match Speed

Information
Object simulation: All the Player and ball data is collected from the sheet and runs on the FPS runtime of the engine, depending on which frame the slider has positioned the position of all objects will be followed by the set Frame. Each player is given a number and their number is displayed on top of them. 
Playback Control:  users can Reset, play, pause and revise the simulation.  
Match Speed: The Match runs based on the set speed given so the user can view the play in a slower motion.
Future Implementations
Add a Draw mechanic to allow the user to highlight important information.
Draw a line to represent the trajectory of the ball and the players.
Add player Highlight when clicked on
Add an information Menu for Players and the ball. Covers their trajectory, speed, and position formation. 



Camera Control






Approach
Camera Selection.
Camera Movement.


Information
Camera Selection: Users can switch between cameras, as each camera is at a different angle and has its own functionality.
Camera Movement:  Some cameras follow a specific object and can shift what it looks at by pressing on the object. Other cameras are stationary and lastly cameras that can move around the field. 

Future Implementations
Add camera rotations to all cameras.
Add field of view adjustment
Adjust Camera angels 


