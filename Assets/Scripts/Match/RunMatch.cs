using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class RunMatch : DataAnalysis
{
    public Slider FrameSlider;
    public Slider FrameSpeedSlider;
    // Ball
    [SerializeField] private GameObject _ball;

    // FPS
    [SerializeField] private int _fps = 25;

    public bool play;
   
    public bool reverse;

    public int framecontrol;

    // Play the sequence, called on button press
    void LateUpdate()
    {

         //convert slider value to int to be able to control it and give it max value
        framecontrol = (int)FrameSlider.value;
        _fps = (int)FrameSpeedSlider.value;
        //  26606 is the frame set inside the table as the start value, anything below will result in an error
        foreach (KeyValuePair<string, Vector3> playerPos in frames[framecontrol+26606])
        {
            GameObject player = GameObject.Find(playerPos.Key.ToString());
            player.transform.position = playerPos.Value;
            
        }
      
        // Move ball
        _ball.transform.position = ballPosDict[framecontrol + 26606];

        if (play)
        {
            FrameSlider.value += _fps * Time.deltaTime;


        }
        if (reverse)
        {
            FrameSlider.value -= _fps * Time.deltaTime;
      

        }

      
    }
    public void PlaySequence()
    {

        play = true;
        reverse = false;
    }
    public void reverseSequence()
    {

        reverse = true;
        play = false;
    }
    public void PauseSequence()
    {
        play = false; 
        reverse = false;
    }
    public void RestSequence()
    {
        FrameSlider.value = 0;
    }


}
