using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Cinemachine;

public class CameratoPlayer : MonoBehaviour
{
    [SerializeField]
    private GameObject _selected;

    // Update is called once per frame
    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            RaycastHit hit;
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out hit, 100.0f) && hit.transform.name != "Plane")
            {
                _selected = hit.transform.gameObject;
                Debug.Log(hit.transform.name);
                this.GetComponent<CinemachineFreeLook>().Follow = _selected.transform;
                this.GetComponent<CinemachineFreeLook>().LookAt= _selected.transform;
            }
        }
    }
}
