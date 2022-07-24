using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class DataAnalysis : MonoBehaviour
{
    public string Dataset;
    [SerializeField]
    private string[] _playerList;


    //players prefab
    public GameObject p;
    [SerializeField]
    private float _feildScale;

    // Player positions
    private List<KeyValuePair<string, Vector3>> playerPos = new List<KeyValuePair<string, Vector3>>();

    // Frames collection Data
    public Dictionary<int, List<KeyValuePair<string, Vector3>>> frames = new Dictionary<int, List<KeyValuePair<string, Vector3>>>();

    // Ball positions
    protected Dictionary<int, Vector3> ballPosDict = new Dictionary<int, Vector3>();

    private void Awake()
    {
        // Collect Datafile from .dat
        Dataset = "Assets/Data/Applicant-test.dat";

        // collect data from the file, function using the .dat file
        CollectData(Dataset);
    }

    void CollectData(string Dataset)
    {

        StreamReader Data = new StreamReader(Dataset);

        while (!Data.EndOfStream)
        {
            // Read data file and store split data
            string line = Data.ReadLine();
            string[] values = line.Split(':');

            int frame = int.Parse(values[0]);

            // create a string list for new players
            playerPos = new List<KeyValuePair<string, Vector3>>();

            // Go through all tracked objects
            _playerList = values[1].Split(';');

            foreach (string Players in _playerList)
            {
                if (!string.IsNullOrEmpty(Players))
                {
                    // Store Player Data
                    string[] PlayerData = Players.Split(',');
                    int team = int.Parse(PlayerData[0]);
                    int trackingID = int.Parse(PlayerData[1]);
                    int playerNumber = int.Parse(PlayerData[2]);
                    float xPos = float.Parse(PlayerData[3]) / _feildScale;
                    float zPos = float.Parse(PlayerData[4])/ _feildScale;
                    float speed = float.Parse(PlayerData[5]);

                    Debug.Log("Frame: " + frame + " Team: " + team + " TrackingID: " + trackingID + " PlayerNumber: " + playerNumber + " X-Position: " + xPos + " Y-Position: " + zPos + " Speed: " + speed);

                    //  Find the player using thier name string
                    GameObject player = GameObject.Find(playerNumber.ToString());

                    Vector3 playerPosition = new Vector3();

                    // store new positions if the player is not in scene, instantiate new players
                    if (player == null)
                    {
                        playerPosition = new Vector3(xPos, 0f, zPos);
                        KeyValuePair<string, Vector3> playerDatas = new KeyValuePair<string, Vector3>( playerNumber.ToString(), new Vector3(xPos, 0, zPos));

                        // Store player position
                        if (!frames.ContainsKey(frame))
                        {
                            playerPos.Add(playerDatas);
                            frames.Add(frame, playerPos);
                        }
                        else
                        {
                            frames[frame].Add(playerDatas);
                        }

                        // Instantiate, give them location to start, give color based on team and name player objects from frem data set 
                        if (team == 0)
                        {
                            player = GameObject.Instantiate(p);
                            player.transform.position = new Vector3(xPos, 0f, zPos);
                            player.GetComponent<Renderer>().material.color = Color.red;
                            player.GetComponent<PlayerData>().speed = speed;
                            player.name =  playerNumber.ToString();

                    
                        }
                        else
                        {
                            player = GameObject.Instantiate(p);
                            player.transform.position = new Vector3(xPos, 0f, zPos);
                            player.GetComponent<Renderer>().material.color = Color.blue;
                            player.GetComponent<PlayerData>().speed = speed;
                            player.name =  playerNumber.ToString();

                        
                        }
                    }
                    // If player already exists, add playerPos from the Data set
                    else
                    {
                        KeyValuePair<string, Vector3> playerDatas = new KeyValuePair<string, Vector3>(playerNumber.ToString(), new Vector3(xPos, 0, zPos));

                        // Store player pos in KVP inside dict
                        if (!frames.ContainsKey(frame))
                        {
                            playerPos.Add(playerDatas);
                            frames.Add(frame, playerPos);
                        }
                        else
                        {
                            frames[frame].Add(playerDatas);
                        }
                    }
                }
            }

            // Split ball data
            string[] ballData = values[2].Split(';');
            foreach (string ballDatas in ballData)
            {
                if (!string.IsNullOrEmpty(ballDatas))
                {
                    string[] PlayerData = ballDatas.Split(',');
                    float xPos = float.Parse(PlayerData[0]) / _feildScale; 
                    float zPos = float.Parse(PlayerData[1]) / _feildScale; 
                    float yPos = float.Parse(PlayerData[2]) / _feildScale; 
                    float ballSpeed = float.Parse(PlayerData[3]);

                    Debug.Log("Frame: " + frame + " X-Position: " + xPos + " Y-Position: " + yPos + " Z-Position: " + zPos + " BallSpeed: " + ballSpeed);

                    // Store ball position in ball pos dictionary
                    Vector3 ballPosition = new Vector3(xPos, yPos, zPos);
                    ballPosDict.Add(frame, ballPosition);
                }
            }
        }

        Data.Close();
    }
}