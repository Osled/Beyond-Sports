using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Cinemachine;

public class CameratoPlayer : MonoBehaviour
{
    [SerializeField]
    private GameObject _selected;
    [SerializeField]
    private GameObject _camFollowText;
    // Update is called once per frame
    void Update()
    {
        // collect the raycast hit data on mouse click
        if (Input.GetMouseButtonDown(0))
        {
            RaycastHit hit;
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out hit, 100.0f) && hit.transform.name != "Plane")
            {
                // set the gameobject into _selected item to be able to manibulate it
                _selected = hit.transform.gameObject;
                Debug.Log(hit.transform.name);
                // change the text of which item has been hit with the ray cast
                _camFollowText.GetComponent<Text>().text = "Camera Follows:" + hit.transform.name;
                // change the Cinemamachine follow and lookat into the new clicked Item to shift the camera focuse
                this.GetComponent<CinemachineFreeLook>().Follow = _selected.transform;
                this.GetComponent<CinemachineFreeLook>().LookAt= _selected.transform;
            }
        }
    }
}
