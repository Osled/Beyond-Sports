using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class RunMatch : DataAnalysis
{
    //sliders that control the match
    public Slider FrameSlider;
    public Slider FrameSpeedSlider;
    // Ball
    [SerializeField] private GameObject _ball;

    // FPS is for the speed of which the match plays at per frame
    [SerializeField] private int _fps = 25;

    //booleans for the playback of the match

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
        // Play allows the match to start based on the speed given
        if (play)
        {
            FrameSlider.value += _fps * Time.deltaTime;


        }
        // Run the match backward
        if (reverse)
        {
            FrameSlider.value -= _fps * Time.deltaTime;
      

        }

      
    }
    // Button functions to play, puase reverse, or rest the match
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
