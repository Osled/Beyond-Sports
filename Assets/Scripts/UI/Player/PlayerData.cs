using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class PlayerData : MonoBehaviour
{
    public float speed;
    public Text m_MyText;


    void Start()
    {
        // Give the text the Name of the Player, which is the player number 
        m_MyText.text = this.gameObject.name;
    }

}
