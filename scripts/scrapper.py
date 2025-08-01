#SCRIPT 1 SCRAP DATA FROM QWASAR UP SKILL
import requests
import time
import pandas as pd
import json
import os
from bs4 import BeautifulSoup
import re
import requests
from datetime import datetime, timedelta
import humanize
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

username = os.getenv('SCRAPER_USERNAME')
password = os.getenv('SCRAPER_PASSWORD')

if not username or not password:
    raise ValueError("Environment variables SCRAPER_USERNAME and SCRAPER_PASSWORD are not set.")

def getAuthToken():
    url = "https://casapp.us.qwasar.io/login"
    params = {
        "service": "https%3A%2F%2Fupskill.us.qwasar.io%2Fusers%2Fservice"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:109.0) Gecko/20100101 Firefox/110.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Dnt": "1",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Te": "trailers"
    }

    response = requests.get(url, params=params, headers=headers)
    authToken = re.search(r'<meta\s+name="csrf-token"\s+content="([a-zA-Z0-9\/+=]+)"\s*/>', response.text)
    lt_pattern = r'<input type="hidden" name="lt" id="lt" value="([^"]+)" autocomplete="off" />'
    lt_value = re.search(lt_pattern, response.text).group(1)
    appcas_session = response.cookies.get('_appcas_session')

    if authToken:
        return authToken.group(1), lt_value, appcas_session
    else:
        print("No auth token found.")

def getTokens():
    url = 'https://upskill.us.qwasar.io/login'
    headers = {
        # 'Host': 'upskill.us.qwasar.io',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:109.0) Gecko/20100101 Firefox/110.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Dnt': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Te': 'trailers'
    }

    response = requests.get(url, headers=headers, allow_redirects=False)
    sessionIdCookies = response.cookies
    authToken, lt_value, appcas_session = getAuthToken()
    # print(authToken, lt_value, appcas_session)
    url = 'https://casapp.us.qwasar.io/login'
    cookies = {'_appcas_session': appcas_session}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:109.0) Gecko/20100101 Firefox/110.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://casapp.us.qwasar.io/login?service=https%3A%2F%2Fupskill.us.qwasar.io%2Fusers%2Fservice',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://casapp.us.qwasar.io',
        'Dnt': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Te': 'trailers'
    }

    data = {
        'authenticity_token': authToken,
        'lt': lt_value,
        'service': 'https://upskill.us.qwasar.io/users/service',
        'username': username,
        'password': password,
    }

    res = requests.post(url, cookies=cookies, headers=headers, data=data, allow_redirects=False)
    # print("pass", res, res.text)

    match = re.search('<a\s+href="(.*?)">', res.text)

    # print(authToken)
    url = match.group(1)
    Cookies = {'_session_id' : sessionIdCookies.get('_session_id')}
    res = requests.get(url, headers=headers, cookies=Cookies, allow_redirects=False)
    userID = res.cookies.get('user.id')
    # print(userID)
    _session_id = res.cookies.get('_session_id')
    # print(_session_id)
    return  {'user.id' : userID, '_session_id' : _session_id}

def harvestProjectsCompleted(soup):
    """Extract all projects under the 'Projects Completed' section."""
    projects = []
    try:
        # Find the header with the text 'Projects In Progress'
        header = soup.find("h2", text=lambda t: t and "Projects Completed" in t)
        
        if header:
            # Locate the outermost container of the section
            section_container = header.find_parent("div", class_="col-span-full")
            
            if section_container:
                # Find all divs with project items inside the section
                for project_div in section_container.find_all("div", class_="border-b border-slate-800"):
                    # Extract the <a> link inside each <li>
                    li = project_div.find("li", class_="flex gap-3 px-3 py-2 text-sm")
                    if li:
                        link = li.find("a", href=True)
                        if link:
                            projects.append(link.text.strip())
    except Exception as e:
        print(f"Error extracting projects: {e}")
    return projects

def harvestProjects(soup):
    """Extract all projects under the 'Projects In Progress' section."""
    projects = []
    try:
        # Find the header with the text 'Projects In Progress'
        header = soup.find("h2", text=lambda t: t and "Projects In Progress" in t)
        
        if header:
            # Locate the outermost container of the section
            section_container = header.find_parent("div", class_="col-span-full")
            
            if section_container:
                # Find all divs with project items inside the section
                for project_div in section_container.find_all("div", class_="border-b border-slate-800"):
                    # Extract the <a> link inside each <li>
                    li = project_div.find("li", class_="flex gap-3 px-3 py-2 text-sm")
                    if li:
                        link = li.find("a", href=True)
                        if link:
                            projects.append(link.text.strip())
    except Exception as e:
        print(f"Error extracting projects: {e}")
    return projects


def harvestBlock(card):
    dic = {}

    try:
        # Extract the track name
        track_name = card.find("h2", class_="text-xl").text.strip()
        
        # Extract progress percentage
        progress_bar = card.find('div', class_='bg-yellow-400') or card.find('div', class_='bg-green-500')
        if progress_bar:
            progress_percent = progress_bar['style'].split('width:')[1].strip().replace(';', '')
        else:
            progress_percent = 'Unknown'
        
        dic[track_name] = progress_percent

    except Exception as e:
        print(f"Error processing track: {e}")
    
    return dic

def scrape(text, id):
    dic = {}
    seasons_data = {}  # Only for seasons
    ongoing_projects = []
    completed_projects = []

    soup = BeautifulSoup(text, 'html.parser')
    # Locate all card elements
    cards = soup.findAll('div', {'class': 'card-with-header'})

    image = soup.find('img', {'height': '256'})['src']
    last_log_ing = soup.find('time', {'data-format': '%B %e, %Y %l:%M%P'})

    if last_log_ing:
        last_log_in = last_log_ing.get_text(strip=True)
    else:
        last_log_in = "N/A"  # If the last login is not found

    projects = harvestProjects(soup)
    projects_completed = harvestProjectsCompleted(soup)
    completed_projects.extend(projects_completed)
    ongoing_projects.extend(projects)

    # Process each card to extract relevant data
    for card in cards:
        dictmp = harvestBlock(card)
        seasons_data.update(dictmp)

    # Add extracted data to the main dictionary
    dic["seasons"] = seasons_data
    dic["img"] = image
    dic["last_log_in"] = last_log_in
    dic["ongoing_projects"] = ongoing_projects
    dic["completed_projects"] = completed_projects

    # Optionally extract other information like Hours Logged
    card_block = soup.findAll('div', {'class': 'card-block'})
    if len(card_block) > 3:
        dic['Hours Logged'] = card_block[3].find('div', {'class': 'col font-size-24 font-weight-bold'}).text.strip()

    return dic


def scrape_and_save():
    print("Scheduled task triggered!")
    cookies=getTokens()
    studentIds = ["moreira_t", "miasko_j", "bizimung_j", "migkas_s", "zaid-wak_a", "martine_fe", "shittu_i", "tofan_c", "araujo-c_d", "tickaite_e","suarez_g",  "martens_h","hopp_h","abdulla_ma","larsen-d_n","pattes_p","muzyka_v","ribberin_k","van-den-_m","dusoruth_n","tavares_c","cahill_d","jose-san_f","kaheel_h","castro-d_i","jegorovs_k","salem_m","mahmud-h_m","antoni_o","davies_s", "malatant_h", "najjar_a", "amein_a", "sardinat_a", "poggio_a", "loginov_a", "markov_a", "kalinina_a", "sinharoy_a", "monchuk_a", "ita_b", "van-niek_b", "nechtan_d", "corley_d", "schmidt_d", "landim_e", "fokke_g", "oga_gr", "costa_g", "kader_h", "mustafa_h", "bugra-na_h", "santos_j", "ramon-ga_j", "kostadin_k", "dow_k", "blanc_la", "tavares-_m", "turkishv_m", "lafaille_m", "mullins_m", "plomp_m", "mykyta_m", "toweett_n", "alkinani_r", "christop_r", "butler_s", "moustafa_s", "ilenloa_s", "aksoy_s", "lima-cid_s", "pezzini_s", "lomidze_t", "parvanov_v", "doynov_v", "musombi_w", "geldenhu_w", "omonzokp_w", "pakhaliu_y", "samodid_y", "andreas_a", "kashkina_a", "van-zyl_c", "kautzman_c", "oliveira_d", "grabek_d", "malac_e", "sezgin_e", "olivier_e", "parra-ci_e", "bozkurt_e", "demir_f", "vilnoiu_g", "danylova_h", "barman_h", "anan_i", "markelis_i", "hilbolli_i", "dudas_j", "hoang_k", "alsleima_l", "palacios_m", "kirsch_m", "sletterh_m", "daoud_me", "morzy_m", "zvirblyt_m", "theron_n", "kirilov_n", "alonge_o", "barrient_p", "sieradzk_p", "amankwa_p", "morgan_r", "caliskan_s", "anan_s", "serdechn_s", "cvetko_t", "rietveld_w", "pashko_y", "bartalo_y", "zaki-_z"]
    url = "https://upskill.us.qwasar.io/users/"
    i = 0 
    finalDic = {}

    for idStudnet in studentIds:
        #print("Grades for the student ", idStudnet)
        res = requests.get(url + idStudnet, cookies=cookies)
        # print(res.text)
        try:

            finalDic[idStudnet] = scrape(res.text, idStudnet)
            #print(finalDic)
        except:
            #print("failed for", idStudnet)
            continue
        i += 1
        print(f"Fetched data for {i} / {len(studentIds)}")

    save_to_json(finalDic)

def save_to_json(finalDic):
    last_modified = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    outputData = []
    for student, grades in finalDic.items():
        # Extract seasons and move other fields outside
        seasons = grades.pop("seasons", {})
        last_log_in_str = grades.get("last_log_in")
        
        if last_log_in_str and last_log_in_str != 'N/A':
            try:
                last_log_in_datetime = datetime.strptime(last_log_in_str, "%B %d, %Y %I:%M%p")
                last_log_in_time_ago = humanize.naturaltime(datetime.now() - last_log_in_datetime)
            except ValueError:
                last_log_in_time_ago = "Invalid date format"
        else:
            last_log_in_time_ago = "No data available"

        outputData.append({
            "name": student,
            "seasons": seasons,
            "img": grades.get("img"),
            "last_log_in": last_log_in_time_ago,
            "ongoing_projects": grades.get("ongoing_projects"),
            "completed_projects": grades.get("completed_projects"),
        })

    outputData.append({"last_modified": last_modified})

    # Get the project root directory 
    repo_root = os.getenv('GITHUB_WORKSPACE', os.getcwd()) 
    print(repo_root)
    # Construct the path to the 'student_grades.json' inside the 'public' folder at the repository's root
    json_file_path = os.path.join(repo_root, 'public', 'student_grades.json')
    # Ensure the directory exists
    os.makedirs(os.path.dirname(json_file_path), exist_ok=True)

    # Save the data to the JSON file
    with open(json_file_path, "w") as jsonFile:
        json.dump(outputData, jsonFile, indent=4)

    print(f"Data saved to {json_file_path}")

    
scrape_and_save()
