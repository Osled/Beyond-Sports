using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MenuControls : MonoBehaviour
{
    [SerializeField]
    private GameObject _guide;
    [SerializeField]
    private GameObject _matchPlayer;

    [SerializeField]
    private GameObject _camera;
    [SerializeField]
    private GameObject _textGuide;


    public void Update()
    {
        if (_camera.activeSelf == true)
        {
            _textGuide.SetActive(true);
        }
        else { _textGuide.SetActive(false); }
    }
    public void Quit()
    {
        Application.Quit();
    }
    // Activate the Guide Menu
    public void Menuactive()
    {
        if (_guide.activeSelf == true)
        {
            _guide.SetActive(false);
        }
        else
        {
            _guide.SetActive(true);
        }
       
    }
    //Activate the MatchControl Menu
    public void MatchPlayeractive()
    {
        if (_matchPlayer.activeSelf == true)
        {
            _matchPlayer.SetActive(false);
        }
        else
        {
            _matchPlayer.SetActive(true);
        }

    }
}
