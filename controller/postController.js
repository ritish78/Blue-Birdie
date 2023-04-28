const likeButton = document.querySelectorAll('.like-button');

likeButton.forEach(button => {
    button.addEventListener('click', (event) => {
        //Changing the class from 'fa-heart' to 'fa-solid fa-heart'
        if (button.classList.contains('fa-solid fa-heart')) {
            button.classList.toggle('fa-heart');
            button.dataset.liked = false;
        } else {
            button.classList.toggle('fa-solid fa-heart');
            button.dataset.liked = true;
        }});

        const postId = button.dataset.id;
        const isLiked = button.dataset.liked; 

        fetch('/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: JSON.stringify({
                postId: postId,
                isLiked: isLiked
            })
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network error!');
            }
        }).then(data => {
            console.log(data.message);
        }).catch(error => {
            console.error('There was a problem with fetch operation', error);
        })
})
